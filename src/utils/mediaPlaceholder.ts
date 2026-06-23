function writeWav(buffer: Float32Array, sampleRate = 44100) {
  const length = buffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function generateAudioUrl() {
  const sampleRate = 44100;
  const duration = 2;
  const length = sampleRate * duration;
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    buffer[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-3 * t);
  }
  const blob = writeWav(buffer, sampleRate);
  return URL.createObjectURL(blob);
}

export function generateImageDataUrl(title: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const gradient = ctx.createLinearGradient(0, 0, 400, 260);
  gradient.addColorStop(0, '#e8f3ee');
  gradient.addColorStop(1, '#d6ddd9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 260);
  ctx.fillStyle = '#1B5E4B';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 200, 135);
  return canvas.toDataURL('image/png');
}

export function generateVideoPoster(title: string) {
  return generateImageDataUrl(title);
}
