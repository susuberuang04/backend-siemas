declare module "pdf-creator-node" {
  function create(html: string, options?: any): Promise<NodeJS.ReadableStream>;
  // Tambahkan deklarasi untuk fungsi-fungsi lain yang ingin Anda gunakan
}
