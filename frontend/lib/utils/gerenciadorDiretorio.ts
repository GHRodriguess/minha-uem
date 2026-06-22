export class GerenciadorDiretorio {
  static async salvarHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MinhaUEMDatabase", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore("handles");
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("handles", "readwrite");
        const store = transaction.objectStore("handles");
        const putRequest = store.put(handle, "diretorioUem");
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async carregarHandle(): Promise<FileSystemDirectoryHandle | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MinhaUEMDatabase", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore("handles");
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("handles", "readonly");
        const store = transaction.objectStore("handles");
        const getRequest = store.get("diretorioUem");
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async removerHandle(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MinhaUEMDatabase", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("handles", "readwrite");
        const store = transaction.objectStore("handles");
        const deleteRequest = store.delete("diretorioUem");
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async verificarPermissao(handle: FileSystemHandle, readWrite: boolean): Promise<boolean> {
    const options: any = {};
    if (readWrite) {
      options.mode = "readwrite";
    }
    try {
      if ((await (handle as any).queryPermission(options)) === "granted") {
        return true;
      }
      if ((await (handle as any).requestPermission(options)) === "granted") {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  static async obterDiretorioHandle(): Promise<FileSystemDirectoryHandle> {
    const handle = await (window as any).showDirectoryPicker();
    await this.salvarHandle(handle);
    return handle;
  }

  static normalizarCaminho(pathParts: string[]): string[] {
    const uemIndex = pathParts.findIndex(p => p.toLowerCase() === "uem");
    if (uemIndex !== -1) {
      return pathParts.slice(uemIndex);
    }
    return pathParts;
  }

  static async obterSubdiretorio(root: FileSystemDirectoryHandle, pathParts: string[]): Promise<FileSystemDirectoryHandle> {
    let currentHandle = root;
    let parts = this.normalizarCaminho(pathParts);
    if (root.name.toLowerCase() === 'uem' && parts[0]?.toLowerCase() === 'uem') {
      parts = parts.slice(1);
    }
    for (const part of parts) {
      if (!part) continue;
      currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
    }
    return currentHandle;
  }

  static async obterSubdiretorioSemCriar(root: FileSystemDirectoryHandle, pathParts: string[]): Promise<FileSystemDirectoryHandle | null> {
    let currentHandle = root;
    let parts = this.normalizarCaminho(pathParts);
    if (root.name.toLowerCase() === 'uem' && parts[0]?.toLowerCase() === 'uem') {
      parts = parts.slice(1);
    }
    for (const part of parts) {
      if (!part) continue;
      try {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: false });
      } catch {
        return null;
      }
    }
    return currentHandle;
  }

  static async gravarArquivoLocal(root: FileSystemDirectoryHandle, pathParts: string[], fileName: string, blob: Blob): Promise<string> {
    const dirHandle = await this.obterSubdiretorio(root, pathParts);
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return [...pathParts, fileName].join("/");
  }

  static async lerArquivoLocal(root: FileSystemDirectoryHandle, pathParts: string[], fileName: string): Promise<Blob> {
    const dirHandle = await this.obterSubdiretorio(root, pathParts);
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file;
  }

  static async verificarArquivoExiste(root: FileSystemDirectoryHandle, pathParts: string[], fileName: string): Promise<boolean> {
    try {
      const dirHandle = await this.obterSubdiretorioSemCriar(root, pathParts);
      if (!dirHandle) return false;
      await dirHandle.getFileHandle(fileName);
      return true;
    } catch {
      return false;
    }
  }

  static async renomearArquivoLocal(root: FileSystemDirectoryHandle, pathParts: string[], oldName: string, newName: string): Promise<boolean> {
    try {
      const dirHandle = await this.obterSubdiretorioSemCriar(root, pathParts);
      if (!dirHandle) return false;
      const fileHandle = await dirHandle.getFileHandle(oldName);
      if ((fileHandle as any).move) {
        await (fileHandle as any).move(newName);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static async removerArquivoLocal(root: FileSystemDirectoryHandle, pathParts: string[], fileName: string): Promise<boolean> {
    try {
      const dirHandle = await this.obterSubdiretorioSemCriar(root, pathParts);
      if (!dirHandle) return false;
      await dirHandle.removeEntry(fileName);
      return true;
    } catch {
      return false;
    }
  }

  static async escanearDiretorioLocal(root: FileSystemDirectoryHandle): Promise<Array<{
    drive_file_id: string | null;
    original_name: string;
    selected_folder: string;
    local_path: string;
  }>> {
    const results: Array<{
      drive_file_id: string | null;
      original_name: string;
      selected_folder: string;
      local_path: string;
    }> = [];

    const escanear = async (handle: FileSystemDirectoryHandle, currentPath: string[]) => {
      for await (const entry of (handle as any).values()) {
        if (entry.kind === "file") {
          const uemIndex = currentPath.findIndex(p => p.toLowerCase() === "uem");
          if (uemIndex !== -1 && currentPath.length - uemIndex >= 6 && currentPath[uemIndex + 1].toLowerCase() === "cursos") {
            const folderCategory = currentPath[currentPath.length - 1];
            const pathPartsFromUem = [...currentPath.slice(uemIndex), entry.name];
            results.push({
              drive_file_id: null,
              original_name: entry.name,
              selected_folder: folderCategory,
              local_path: pathPartsFromUem.join("/")
            });
          }
        } else if (entry.kind === "directory") {
          await escanear(entry, [...currentPath, entry.name]);
        }
      }
    };

    await escanear(root, [root.name]);
    return results;
  }
}
