"use client";

import { useEffect, useRef, useState } from "react";

// Holds a local preview URL for an image, revoking the previous one when it
// changes and the last one when the component unmounts
export function usePreviewUrl() {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  function setPreviewFile(file: File | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = file ? URL.createObjectURL(file) : null;
    setUrl(urlRef.current);
  }

  return [url, setPreviewFile] as const;
}
