import { TypeData, TypeElement, TypeElemDesc } from '@idraw/types';
import util from '@idraw/util';
import { LoaderEvent, TypeLoadData, TypeLoaderEventArgMap } from './loader-event';

const { loadImage } = util.loader;

type Options = {
  maxParallelNum: number
}

enum LoaderStatus {
  FREE = 'free',
  LOADING = 'loading',
  COMPLETE = 'complete',
}

export default class Loader {

  private _opts: Options;
  private _event: LoaderEvent;
  private _loadData: TypeLoadData = {};
  private _uuidQueue: string[] = [];
  private _status: LoaderStatus = LoaderStatus.FREE

  constructor(opts: Options) {
    this._opts = opts;
    this._event = new LoaderEvent();
  }

  load(data: TypeData): void {
    const [uuidQueue, loadData] = this._resetLoadData(data);
    this._uuidQueue = uuidQueue;
    this._loadData = loadData;
    if (this._status === LoaderStatus.FREE) {
      this._loadTask();
    }
  }

  on<T extends keyof TypeLoaderEventArgMap>(
    name: T,
    callback: (arg: TypeLoaderEventArgMap[T]
  ) => void) {
    this._event.on(name, callback);
  }

  off<T extends keyof TypeLoaderEventArgMap>(
    name: T,
    callback: (arg: TypeLoaderEventArgMap[T]
  ) => void) {
    this._event.off(name, callback);
  }

  isComplete() {
    return this._status === LoaderStatus.COMPLETE;
  }

  private _resetLoadData(data: TypeData): [string[], TypeLoadData] {
    const loadData: TypeLoadData = this._loadData;
    const uuidQueue: string[] = [];

    // add new load-data
    for (let i = data.elements.length - 1; i >= 0; i --) {
      const elem = data.elements[i];
      if (['image', 'svg'].includes(elem.type) && !loadData[elem.uuid]) {
        loadData[elem.uuid] = this._createEmptyLoadItem(elem);
        uuidQueue.push(elem.uuid);
      }
    }

    // clear unuse load-data
    const uuids = Object.keys(loadData);
    data.elements.forEach((elem) => {
      if (uuids.includes(elem.uuid) !== true) {
        delete loadData[elem.uuid];
      }
    });
    return [uuidQueue, loadData];
  }

  private _createEmptyLoadItem(elem: TypeElement<keyof TypeElemDesc>): TypeLoadData[string] {
    let source = '';
    let type: TypeLoadData[string]['type'] = 'image';
    if (elem.type === 'image') {
      const _elem = elem as TypeElement<'image'>;
      source = _elem.desc.src || '';
    } else if (elem.type === 'svg') {
      const _elem = elem as TypeElement<'svg'>;
      source = _elem.desc.svg || '';
    }
    return {
      type: type,
      status: 'null',
      content: null,
      source,
    }
  }

  private _loadTask() {
    if (this._status === LoaderStatus.LOADING) {
      return;
    }

    if (this._uuidQueue.length === 0) {
      this._status = LoaderStatus.COMPLETE;
      this._event.trigger('complete', undefined);
      return;
    }

    const { maxParallelNum } = this._opts;
    const uuids = this._uuidQueue.splice(0, maxParallelNum);
    const uuidMap: {[uuid: string]: number} = {};

    uuids.forEach((url, i) => {
      uuidMap[url] = i;
    });
    const loadUUIDList: string[] = [];
    const _loadAction = () => {
  
      if (loadUUIDList.length >= maxParallelNum) {
        return false;
      }
      if (uuids.length === 0) {
        return true;
      }

      for (let i = loadUUIDList.length; i < maxParallelNum; i++) {
        const uuid = uuids.shift();
        if (uuid === undefined) {
          break
        }
        loadUUIDList.push(uuid);

        this._loadElementSource(this._loadData[uuid]).then((image) => {
          loadUUIDList.splice(loadUUIDList.indexOf(uuid), 1);
          const status = _loadAction();
          this._loadData[uuid].status = 'loaded';
          this._loadData[uuid].content = image;
          if (loadUUIDList.length === 0 && uuids.length === 0 && status === true) {
            this._status = LoaderStatus.FREE;
            this._loadTask();
          }
          this._event.trigger('load', {
            type: this._loadData[uuid].type,
            status: this._loadData[uuid].status,
            content: this._loadData[uuid].content,
            source: this._loadData[uuid].source,
          });
        }).catch((err) => {
          loadUUIDList.splice(loadUUIDList.indexOf(uuid), 1);
          const status = _loadAction();
          this._loadData[uuid].status = 'fail';
            this._loadData[uuid].error = err;
          if (loadUUIDList.length === 0 && uuids.length === 0 && status === true) {
            this._status = LoaderStatus.FREE;
            this._loadTask();
          } 
          this._event.trigger('error', {
            type: this._loadData[uuid].type,
            status: this._loadData[uuid].status,
            content: this._loadData[uuid].content,
            source: this._loadData[uuid].source,
          })
        })
 
      }
      return false;
    }
    _loadAction();
  }

  private async _loadElementSource(
    params: TypeLoadData[string]
  ): Promise<HTMLImageElement> {
    if (params.type === 'image') {
      const image = await loadImage(params.source);
      return image;
    }
    throw Error('Element\'s source is not support!')
  }
}


