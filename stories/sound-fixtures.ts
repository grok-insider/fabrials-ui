// Synthetic sound for the stories: tones built in code, so nothing is a person's voice, nothing comes from the network and
// no microphone is asked for.

/** A sine tone as a 16-bit mono WAV, with a short fade at each end so it does not click. */
export function toneWav(frequency = 440, seconds = 1, sampleRate = 8000): Blob {
  const count = Math.round(seconds * sampleRate);
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let at = 0; at < text.length; at += 1) view.setUint8(offset + at, text.charCodeAt(at));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + count * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, count * 2, true);
  const fade = Math.min(count / 2, sampleRate * 0.02);
  for (let at = 0; at < count; at += 1) {
    const envelope = Math.min(1, at / fade, (count - 1 - at) / fade);
    view.setInt16(44 + at * 2, Math.round(Math.sin((2 * Math.PI * frequency * at) / sampleRate) * 0.2 * envelope * 32767), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** The same tone as a data URI: a source that needs no object URL, for a state shown at first paint. */
export function toneDataUri(frequency = 440, seconds = 1, sampleRate = 4000): string {
  const count = Math.round(seconds * sampleRate);
  const bytes = new Uint8Array(44 + count);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => {
    for (let at = 0; at < text.length; at += 1) bytes[offset + at] = text.charCodeAt(at);
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + count, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, "data");
  view.setUint32(40, count, true);
  for (let at = 0; at < count; at += 1) bytes[44 + at] = 128 + Math.round(Math.sin((2 * Math.PI * frequency * at) / sampleRate) * 24);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * A stream that stands in for the microphone: an oscillator through a `MediaStreamDestination`. It makes no sound on the
 * speakers, and its audio context closes when the recorder stops the track.
 */
export async function fakeMicrophone(): Promise<MediaStream> {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const destination = context.createMediaStreamDestination();
  oscillator.frequency.value = 330;
  gain.gain.value = 0.2;
  oscillator.connect(gain).connect(destination);
  oscillator.start();
  await context.resume().catch(() => undefined);
  for (const track of destination.stream.getAudioTracks()) {
    const stop = track.stop.bind(track);
    track.stop = () => {
      stop();
      void context.close().catch(() => undefined);
    };
  }
  return destination.stream;
}
