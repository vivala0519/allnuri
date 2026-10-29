import { useEffect, useRef, useState } from 'react';

export function SearchAdConfirmation({ query, onConfirm, onCancel }: {
  query: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
      aria-labelledby="search-ad-title"
      className="m-auto w-[calc(100%-40px)] max-w-sm rounded-[24px] bg-white p-6 text-onnuri-ink backdrop:bg-black/40">
      <h2 id="search-ad-title" className="text-xl font-bold">광고를 보고 검색결과를 확인할까요?</h2>
      <p className="mt-3 text-sm leading-relaxed text-onnuri-soft">전면 광고를 닫으면 ‘{query}’ 검색결과를 보여드려요.</p>
      <button type="button" disabled={busy} onClick={async () => {
        if (busy) return;
        setBusy(true);
        try { await onConfirm(); } finally { setBusy(false); }
      }} className="mt-6 min-h-12 w-full rounded-xl bg-onnuri-green px-3 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? '광고 확인 중…' : '광고 보고 검색결과 확인하기'}
      </button>
      <button type="button" disabled={busy} onClick={onCancel} className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-onnuri-soft disabled:opacity-60">취소</button>
    </dialog>
  );
}
