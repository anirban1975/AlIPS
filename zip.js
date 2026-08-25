// Minimal ZIP writer (STORE method, no compression) — enough to build a valid
// .pptx in the browser with no library and no build step.
// Usage: zipBlob([{ name: "ppt/presentation.xml", text: "<xml…>" }, …])

const ZIP = (function () {
  // CRC-32, table built once.
  const TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  const enc = new TextEncoder();

  function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
  function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

  // DOS date/time — a fixed timestamp keeps output deterministic.
  const DOS_TIME = 0x6000;          // 12:00:00
  const DOS_DATE = ((2025 - 1980) << 9) | (1 << 5) | 1;   // 2025-01-01

  function zipBlob(files) {
    const chunks = [], central = [];
    let offset = 0;

    files.forEach((f) => {
      const nameBytes = enc.encode(f.name);
      const data = f.bytes ? f.bytes : enc.encode(f.text);
      const crc = crc32(data);

      const local = [].concat(
        u32(0x04034b50), u16(20), u16(0), u16(0),
        u16(DOS_TIME), u16(DOS_DATE),
        u32(crc), u32(data.length), u32(data.length),
        u16(nameBytes.length), u16(0)
      );
      chunks.push(new Uint8Array(local), nameBytes, data);

      central.push([].concat(
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
        u16(DOS_TIME), u16(DOS_DATE),
        u32(crc), u32(data.length), u32(data.length),
        u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset)
      ));
      central.push(nameBytes);

      offset += local.length + nameBytes.length + data.length;
    });

    const centralParts = [];
    let centralSize = 0;
    central.forEach((c) => {
      const arr = c instanceof Uint8Array ? c : new Uint8Array(c);
      centralParts.push(arr);
      centralSize += arr.length;
    });

    const end = new Uint8Array([].concat(
      u32(0x06054b50), u16(0), u16(0),
      u16(files.length), u16(files.length),
      u32(centralSize), u32(offset), u16(0)
    ));

    return new Blob([...chunks, ...centralParts, end], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    });
  }

  return { zipBlob, crc32 };
})();
