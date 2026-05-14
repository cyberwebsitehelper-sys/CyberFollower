"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, Check, FileText, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CyberComplaint } from "@/lib/api-service";

interface ClosedComplaintsProps {
  complaints: CyberComplaint[];
  onBack: () => void;
}

export function ClosedComplaints({ complaints, onBack }: ClosedComplaintsProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showExcelOptions, setShowExcelOptions] = useState(false);
  const isOpenableFile = (value: string | null | undefined) => !!value && /^https?:\/\//i.test(value);

  const toIsoDate = (value: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const normalizedRows = useMemo(() => {
    return complaints.map((c) => ({
      "Bank Name": c.bank_name || "",
      "ACK Number": c.ack_number || "",
      "IFSC Code": c.ifsc_code || "",
      "State": c.state_name || "",
      "District": c.district || "",
      "Layer": c.layer || "",
      "TXN Amount": Number(c.txn_amount || 0),
      "Dispute Amount": Number(c.dispute_amount || 0),
      "UTR Number": c.utr_number || "",
      "Police Station": c.police_station || "",
      "Vendor Name": c.vendor_name || "",
      "Comment": c.comment || "NULL",
      "NOC File": c.noc_file || "",
      "Completed At": toIsoDate(c.completed_at),
    }));
  }, [complaints]);

  const getRowsByDate = () => {
    if (!fromDate && !toDate) return normalizedRows;
    return normalizedRows.filter((row) => {
      const date = String(row["Completed At"] || "");
      if (!date) return false;
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    });
  };

  const toCsv = (rows: Record<string, string | number>[]) => {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.map(esc).join(",")];
    for (const row of rows) lines.push(headers.map((h) => esc(row[h])).join(","));
    return lines.join("\n");
  };

  const toExcelHtml = (rows: Record<string, string | number>[]) => {
    if (!rows.length) return "<table></table>";
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const head = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
    const body = rows
      .map((row) => `<tr>${headers.map((h) => `<td>${esc(row[h])}</td>`).join("")}</tr>`)
      .join("");
    return `<html><head><meta charset="utf-8" /></head><body><table border="1">${head}${body}</table></body></html>`;
  };

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCsv = (rows: Record<string, string | number>[], suffix: string) => {
    const csv = toCsv(rows);
    downloadBlob(`closed-cyber-complaints-${suffix}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  };

  const exportExcel = (rows: Record<string, string | number>[], suffix: string) => {
    const html = toExcelHtml(rows);
    downloadBlob(
      `closed-cyber-complaints-${suffix}.xls`,
      new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
    );
  };

  const makeZip = (files: { name: string; data: Uint8Array }[]) => {
    const crc32Table = (() => {
      const table = new Uint32Array(256);
      for (let i = 0; i < 256; i += 1) {
        let c = i;
        for (let j = 0; j < 8; j += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c >>> 0;
      }
      return table;
    })();

    const crc32 = (data: Uint8Array) => {
      let crc = 0xffffffff;
      for (let i = 0; i < data.length; i += 1) crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
      return (crc ^ 0xffffffff) >>> 0;
    };

    const chunks: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;
    const encoder = new TextEncoder();

    const pushU16 = (view: DataView, pos: number, value: number) => view.setUint16(pos, value, true);
    const pushU32 = (view: DataView, pos: number, value: number) => view.setUint32(pos, value, true);

    for (const file of files) {
      const name = file.name.replace(/[\\/:*?"<>|]/g, "_");
      const nameBytes = encoder.encode(name);
      const data = file.data;
      const crc = crc32(data);

      const local = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(local.buffer);
      pushU32(localView, 0, 0x04034b50);
      pushU16(localView, 4, 20);
      pushU16(localView, 6, 0);
      pushU16(localView, 8, 0);
      pushU16(localView, 10, 0);
      pushU16(localView, 12, 0);
      pushU32(localView, 14, crc);
      pushU32(localView, 18, data.length);
      pushU32(localView, 22, data.length);
      pushU16(localView, 26, nameBytes.length);
      pushU16(localView, 28, 0);
      local.set(nameBytes, 30);

      chunks.push(local, data);

      const c = new Uint8Array(46 + nameBytes.length);
      const cView = new DataView(c.buffer);
      pushU32(cView, 0, 0x02014b50);
      pushU16(cView, 4, 20);
      pushU16(cView, 6, 20);
      pushU16(cView, 8, 0);
      pushU16(cView, 10, 0);
      pushU16(cView, 12, 0);
      pushU16(cView, 14, 0);
      pushU32(cView, 16, crc);
      pushU32(cView, 20, data.length);
      pushU32(cView, 24, data.length);
      pushU16(cView, 28, nameBytes.length);
      pushU16(cView, 30, 0);
      pushU16(cView, 32, 0);
      pushU16(cView, 34, 0);
      pushU16(cView, 36, 0);
      pushU32(cView, 38, 0);
      pushU32(cView, 42, offset);
      c.set(nameBytes, 46);
      central.push(c);

      offset += local.length + data.length;
    }

    const centralSize = central.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    pushU32(endView, 0, 0x06054b50);
    pushU16(endView, 4, 0);
    pushU16(endView, 6, 0);
    pushU16(endView, 8, files.length);
    pushU16(endView, 10, files.length);
    pushU32(endView, 12, centralSize);
    pushU32(endView, 16, offset);
    pushU16(endView, 20, 0);

    return new Blob([...chunks, ...central, end], { type: "application/zip" });
  };

  const downloadNocZip = async () => {
    const filesToFetch = complaints
      .filter((c) => c.noc_file && isOpenableFile(c.noc_file))
      .map((c, i) => ({ url: c.noc_file as string, base: `${c.ack_number || "row"}-${i + 1}` }));

    if (!filesToFetch.length) return;

    const zippedFiles: { name: string; data: Uint8Array }[] = [];
    for (const file of filesToFetch) {
      try {
        const res = await fetch(file.url);
        if (!res.ok) continue;
        const blob = await res.blob();
        const buf = new Uint8Array(await blob.arrayBuffer());
        const extMatch = file.url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1] : "bin";
        zippedFiles.push({ name: `${file.base}.${ext}`, data: buf });
      } catch {
      }
    }

    if (!zippedFiles.length) return;
    const zip = makeZip(zippedFiles);
    downloadBlob("closed-cyber-complaints-noc-files.zip", zip);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Red Header */}
      <header 
        className="text-white px-6 py-3"
        style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">CYBER SYSTEM</span>
          </div>
        </div>
      </header>

      {/* Dark Navigation */}
      <nav className="bg-[#2c3e50] text-white px-6 py-3">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <span className="text-white/50">|</span>
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Closed Cyber Complaints
          </span>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="bg-white border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Closed Cyber Complaints</h1>
          <p className="text-sm text-gray-500">Dashboard &gt; Closed Complaints</p>
        </div>
      </div>
      <div className="px-6 pt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 justify-end">
            <Button onClick={() => setShowExcelOptions((prev) => !prev)}>Export Excel</Button>
            { /*<Button variant="outline" onClick={() => exportCsv(normalizedRows, "all")}>Export All CSV</Button> */}
            <Button variant="secondary" onClick={downloadNocZip}>Download NOC Images ZIP</Button>
          </div>
          {showExcelOptions && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">From Date</p>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">To Date</p>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <Button
                  onClick={() => exportExcel(getRowsByDate(), "date-range")}
                >
                  Export Date-Range Excel
                </Button>
                <Button variant="outline" onClick={() => exportExcel(normalizedRows, "all")}>
                  Export All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #27ae60" }}>
            <p className="text-xs text-gray-500 mb-1">Total Closed</p>
            <p className="text-2xl font-bold text-green-600">{complaints.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #3498db" }}>
            <p className="text-xs text-gray-500 mb-1">Total TXN Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              ₹{complaints.reduce((sum, c) => sum + Number(c.txn_amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #9b59b6" }}>
            <p className="text-xs text-gray-500 mb-1">Total Dispute Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              ₹{complaints.reduce((sum, c) => sum + Number(c.dispute_amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #e74c3c" }}>
            <p className="text-xs text-gray-500 mb-1">With NOC File</p>
            <p className="text-2xl font-bold text-[#e74c3c]">
              {complaints.filter((c) => c.noc_file).length}
            </p>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[
                    "Bank Name",
                    "ACK Number",
                    "IFSC Code",
                    "State",
                    "District",
                    "Layer",
                    "TXN Amount",
                    "Dispute Amount",
                    "UTR Number",
                    "Police Station",
                    "Vendor Name",
                    "Comment",
                    "NOC File",
                    "Completed At",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {complaints.map((complaint, index) => {
                    const rowId = complaint.id || (complaint as any)._id;
                    return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.bank_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap font-mono">
                        {complaint.ack_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap font-mono">
                        {complaint.ifsc_code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.state_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.district}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.layer}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        ₹{Number(complaint.txn_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        ₹{Number(complaint.dispute_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap font-mono">
                        {complaint.utr_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.police_station}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.vendor_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.comment || "NULL"}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {complaint.noc_file && isOpenableFile(complaint.noc_file) ? (
                          <a
                            href={complaint.noc_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 flex items-center gap-1 hover:underline"
                            download
                          >
                            <Check className="w-3 h-3" />
                            <FileText className="w-3 h-3" />
                            View / Download
                          </a>
                        ) : complaint.noc_file ? (
                          <span className="text-amber-600">Legacy file path (not public URL)</span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {complaint.completed_at
                          ? new Date(complaint.completed_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {complaints.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No closed complaints found</p>
                <p className="text-sm">
                  Complaints will appear here once they are fully completed
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
