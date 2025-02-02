// import { TypePaintData } from './paint';

type TypeElementAttrs = {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  operation?: {
    lock?: boolean,
    invisible?: boolean,
  }
  extension?: {[key: string]: any} | any;
}

type TypeElementBase <T extends keyof TypeElemDesc | TypeElemType> = TypeElementAttrs & {
  name?: string;
  uuid?: string;
  type: T | TypeElemType;
  desc: TypeElemDesc[T];
}

type TypeElement<T extends keyof TypeElemDesc | TypeElemType> = TypeElementBase<T> & {
  uuid: string;
}

type TypeElemBoxDesc = {
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

type TypeElemDesc = {
  'text': TypeElemDescText,
  'rect': TypeElemDescRect,
  'circle': TypeElemDescCircle,
  'image': TypeElemDescImage,
  'svg': TypeElemDescSVG,
  'html': TypeElemDescHTML,
  // paint: TypeElemDescPaint,
}

// enum TypeElemType {
//   text = 'text',
//   rect = 'rect',
//   circle = 'circle',
//   image = 'image',
//   svg = 'svg',
//   html = 'html',
// }

type TypeElemType = 'text' | 'rect' | 'circle' | 'image' | 'svg' | 'html';

type TypeElemDescRect = {
  bgColor?: string;
} & TypeElemBoxDesc

type TypeElemDescText = {
  text: string;
  color: string;
  fontSize: number;
  lineHeight?: number;
  fontWeight?: 'bold' | '';
  fontFamily?: string;
  textAlign?: 'center' | 'left' | 'right';
  bgColor?: string;
} & TypeElemBoxDesc

type TypeElemDescCircle = {
  bgColor: string;
} & TypeElemBoxDesc

type TypeElemDescImage = {
  src: string;
}

type TypeElemDescSVG = {
  svg: string;
}

type TypeElemDescHTML = {
  html: string;
  width: number;
  height: number;
}

// type TypeElemDescPaint = TypePaintData

export {
  TypeElementAttrs,
  TypeElemDescText,
  TypeElemDescRect,
  TypeElemDescCircle,
  TypeElemDescImage,
  TypeElemDescSVG,
  TypeElemDescHTML,
  TypeElemDesc,
  TypeElemType,
  TypeElement,
  TypeElementBase,
};