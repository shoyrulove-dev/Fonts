"use client";

import { useEffect, useMemo, useState } from "react";

const weights = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800, Black: 900 };

function descriptor(file: string) {
  const name = file.split("/").pop() ?? file;
  const italic = name.includes("Italic");
  const match = Object.keys(weights).find((item) => name.includes(item));
  return { weight: match ? weights[match as keyof typeof weights] : 400, italic };
}

export default function FontPreview({ files, sample, slug }: { files: string[]; sample: string; slug?: string }) {
  const [text, setText] = useState(sample);
  const [weight, setWeight] = useState(400);
  const [italic, setItalic] = useState(false);
  const faces = useMemo(() => files.map((file) => {
    const info = descriptor(file);
    return "@font-face{font-family:'BlissPreview';font-style:" + (info.italic ? "italic" : "normal") + ";font-weight:" + info.weight + ";src:url('https://assets.blissbiovn.com/" + file + "') format('woff2');font-display:swap;}";
  }).join(""), [files]);
  const availableWeights = [...new Set(files.map((file) => descriptor(file).weight))].sort((a, b) => a - b);
  useEffect(() => { if (slug) void fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "font_view", slug }) }); }, [slug]);

  return (
    <>
      {files.length > 0 && <style dangerouslySetInnerHTML={{ __html: faces }} />}
      <div data-reveal className="mt-10 overflow-hidden text-4xl leading-tight text-[#5e7965] sm:text-6xl" style={files.length ? { fontFamily: "BlissPreview", fontStyle: italic ? "italic" : "normal", fontWeight: weight } : undefined}>{text}</div>
      {files.length === 0 && <p className="mt-4 text-sm text-[#697169]">This family has a large character set, so the web preview is limited. The complete files are available in the ZIP.</p>}
      <div className="mt-10 border-t border-[#e3e2da] pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#697169]">Type tester</p>{files.length > 0 && <div className="flex gap-2"><select value={weight} onChange={(event) => setWeight(Number(event.target.value))} className="rounded-full border border-[#d8d7cc] bg-white px-3 py-1 text-xs" aria-label="Font weight">{availableWeights.map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="button" onClick={() => setItalic(!italic)} className={"rounded-full border px-3 py-1 text-xs " + (italic ? "border-[#5e7965] bg-[#dce8dc]" : "border-[#d8d7cc]")}>Italic</button></div>}</div>
        <textarea className="min-h-28 w-full resize-y rounded-xl border border-[#d8d7cc] p-4 text-2xl outline-none focus:border-[#5e7965]" style={files.length ? { fontFamily: "BlissPreview", fontStyle: italic ? "italic" : "normal", fontWeight: weight } : undefined} value={text} onChange={(event) => setText(event.target.value)} aria-label="Type tester" />
      </div>
    </>
  );
}
