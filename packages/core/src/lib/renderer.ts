import { TypeContext, TypeData, TypeHelperConfig } from '@idraw/types';
import { drawContext } from './draw';
import Board from '@idraw/board';
 
export default class Renderer {

  private _board: Board;
  private _ctx: TypeContext;
  private _data: TypeData = { elements: [] };

  constructor(board: Board) {
    this._board = board;
    this._ctx = this._board.getContext();
  }

  render(data: TypeData, config: TypeHelperConfig): void {
    this._data = data;
    drawContext(this._ctx, this._data, config);
    this._board.draw();
  }
}