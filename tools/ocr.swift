// tools/ocr.swift - each page of a scanned PDF through Apple's Vision text recognition (accurate,
// no language correction), for transcribing a source: lines in reading order, each with where it
// begins across the page (0 to 1) and a tab before its text, under "; [page N]" markers. macOS
// only; needs the Xcode command line tools. tools/ocr-vote.js turns many copies of a page into
// one reading. Part of bench-kit (github.com/critical-code-studies/bench-kit).
//
//   swiftc -O -o /tmp/ocr research/kit/tools/ocr.swift
//   /tmp/ocr scan.pdf scan.ocr.txt
import Foundation
import PDFKit
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count == 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
  FileHandle.standardError.write("usage: ocr scan.pdf out.txt\n".data(using: .utf8)!); exit(1)
}
var out = ""
for i in 0..<doc.pageCount {
  guard let page = doc.page(at: i) else { continue }
  let box = page.bounds(for: .mediaBox), scale: CGFloat = 3
  let w = Int(box.width * scale), h = Int(box.height * scale)
  let cs = CGColorSpaceCreateDeviceRGB()
  guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { continue }
  ctx.setFillColor(NSColor.white.cgColor); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  guard let img = ctx.makeImage() else { continue }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])
  let obs = (req.results ?? []).sorted { a, b in
    abs(a.boundingBox.midY - b.boundingBox.midY) > 0.008 ? a.boundingBox.midY > b.boundingBox.midY : a.boundingBox.minX < b.boundingBox.minX
  }
  out += "; [page \(i + 1)]\n"
  // lines at the same height are joined, as one printed line
  var lastY: CGFloat = -1, line = "", x0: CGFloat = 0
  for o in obs {
    guard let t = o.topCandidates(1).first?.string else { continue }
    if lastY >= 0 && abs(o.boundingBox.midY - lastY) <= 0.008 { line += "  " + t }
    else { if !line.isEmpty { out += String(format: "%.3f\t", x0) + line + "\n" }; line = t; x0 = o.boundingBox.minX }
    lastY = o.boundingBox.midY
  }
  if !line.isEmpty { out += String(format: "%.3f\t", x0) + line + "\n" }
}
try! out.write(toFile: args[2], atomically: true, encoding: .utf8)
print("\(doc.pageCount) pages -> \(args[2])")
