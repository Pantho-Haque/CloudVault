"use client";

import { useParams } from "next/navigation";
import FileBrowser from "@/components/files/FileBrowser";

export default function FilesPage() {
  const params = useParams();
  const pathSegments = params.path as string[] | undefined;
  const currentPath = pathSegments ? pathSegments.join("/") : "";

  return <FileBrowser initialPath={currentPath} />;
}
