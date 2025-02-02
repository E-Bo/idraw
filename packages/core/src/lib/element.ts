import {
  TypeContext,
  TypePoint,
  TypeData,
  TypeHelperWrapperDotDirection,
  TypeElement,
  TypeElemDesc,
} from '@idraw/types';
import util from '@idraw/util';
import { rotateElement } from './transform';
import { calcRadian, calcElementCenter, parseRadianToAngle } from './calculate';
import { limitAngle, limitNum } from './value';

const { createUUID } = util.uuid;

export class Element {
  private _ctx: TypeContext;

  constructor(ctx: TypeContext) {
    this._ctx = ctx;
  }

  initData (data: TypeData): TypeData {
    data.elements.forEach((elem) => {
      if (!(elem.uuid && typeof elem.uuid === 'string')) {
        elem.uuid = createUUID();
      }
    });
    return data;
  }

  isPointInElement(p: TypePoint, data: TypeData): [number, string | null] {
    const ctx = this._ctx;
    let idx = -1;
    let uuid = null;
    for (let i = data.elements.length - 1; i >= 0; i--) {
      const ele = data.elements[i];
      let bw = 0;
      // @ts-ignore
      if (ele.desc?.borderWidth > 0) {
        // @ts-ignore
        bw = ele.desc.borderWidth;
      }

      rotateElement(ctx, ele, () => {
        ctx.beginPath();
        ctx.moveTo(ele.x - bw, ele.y - bw);
        ctx.lineTo(ele.x + ele.w + bw, ele.y - bw);
        ctx.lineTo(ele.x + ele.w + bw, ele.y + ele.h + bw);
        ctx.lineTo(ele.x - bw, ele.y + ele.h + bw);
        ctx.lineTo(ele.x, ele.y);

        ctx.rect(ele.x, ele.y, ele.w, ele.h);
        ctx.closePath();
        if (ctx.isPointInPath(p.x, p.y)) {
          idx = i;
          uuid = ele.uuid;
        }
      });

      if (idx >= 0) {
        break;
      }
    }
    return [idx, uuid];
  }

  dragElement(data: TypeData, uuid: string, point: TypePoint, prevPoint: TypePoint, scale: number): void {
    const index = this.getElementIndex(data, uuid);
    if (!data.elements[index]) {
      return;
    }
    const moveX = point.x - prevPoint.x;
    const moveY = point.y - prevPoint.y;
    data.elements[index].x += (moveX / scale);
    data.elements[index].y += (moveY / scale);
    this.limitElementAttrs(data.elements[index]);
  }

  transformElement(
    data: TypeData,
    uuid: string,
    point: TypePoint,
    prevPoint: TypePoint,
    scale: number,
    direction: TypeHelperWrapperDotDirection
  ): null | {
    width: number,
    height: number,
    angle: number,
  } {
    const index = this.getElementIndex(data, uuid);
    if (!data.elements[index]) {
      return null;
    }
    if (data.elements[index]?.operation?.lock === true) {
      return null;
    }
    const moveX = (point.x - prevPoint.x) / scale;
    const moveY = (point.y - prevPoint.y) / scale;
    const elem = data.elements[index];
    // const { devicePixelRatio } = this._ctx.getSize();

    switch (direction) {
      case 'top-left': {
        if (elem.w - moveX > 0 && elem.h - moveY > 0)  {
          elem.x += moveX;
          elem.y += moveY;
          elem.w -= moveX;
          elem.h -= moveY;
        }
        break;
      }
      case 'top': {
        if (elem.h - moveY > 0) {
          elem.y += moveY;
          elem.h -= moveY;
        }
        break;
      }
      case 'top-right': {
        if (elem.h - moveY > 0 && elem.w + moveX > 0) {
          elem.y += moveY;
          elem.w += moveX;
          elem.h -= moveY;
        }
        break;
      }
      case 'right': {
        if (elem.w + moveX > 0) {
          elem.w += moveX;
        }
        break;
      }
      case 'bottom-right': {
        if (elem.w + moveX > 0 && elem.h + moveY > 0) {
          elem.w += moveX;
          elem.h += moveY;
        }
        break;
      }
      case 'bottom': {
        if (elem.h + moveY > 0) {
          elem.h += moveY;
        }
        break;
      }
      case 'bottom-left': {
        if (elem.w - moveX > 0 && elem.h + moveY > 0) {
          elem.x += moveX;
          elem.w -= moveX;
          elem.h += moveY;
        }
        break;
      }
      case 'left': {
        if (elem.w - moveX > 0) {
          elem.x += moveX;
          elem.w -= moveX;
        }
        break;
      }
      case 'rotate': {
        const center = calcElementCenter(elem);
        const radian = calcRadian(center, prevPoint, point);
        elem.angle = (elem.angle || 0) + parseRadianToAngle(radian);
        break;
      }
      default: {
        break;
      }
    }

    this.limitElementAttrs(elem);

    return {
      width: limitNum(elem.w),
      height: limitNum(elem.h),
      angle: limitAngle(elem.angle || 0),
    };
  }

  getElementIndex(data: TypeData, uuid: string): number {
    let idx = -1;
    for (let i = 0; i < data.elements.length; i++) {
      if (data.elements[i].uuid === uuid) {
        idx = i;
        break;
      }
    }
    return idx;
  }

  limitElementAttrs(elem: TypeElement<keyof TypeElemDesc>) {
    elem.x = limitNum(elem.x);
    elem.y = limitNum(elem.y);
    elem.w = limitNum(elem.w);
    elem.h = limitNum(elem.h);
    elem.angle = limitAngle(elem.angle || 0);
  }
  
}
