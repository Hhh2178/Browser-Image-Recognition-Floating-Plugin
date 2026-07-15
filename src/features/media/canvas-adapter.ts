export interface DecodedImage {
  width: number;
  height: number;
  source: CanvasImageSource;
}

export interface CanvasAdapter {
  decode(input: Blob): Promise<DecodedImage>;
  encode(
    source: CanvasImageSource,
    width: number,
    height: number,
    quality: number
  ): Promise<Blob>;
}

export const browserCanvasAdapter: CanvasAdapter = {
  async decode(input) {
    const bitmap = await createImageBitmap(input);
    return { width: bitmap.width, height: bitmap.height, source: bitmap };
  },
  async encode(source, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("浏览器无法创建图片画布");
    }
    context.drawImage(source, 0, 0, width, height);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败")),
        "image/jpeg",
        quality
      );
    });
  }
};
