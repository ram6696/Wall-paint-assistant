
class UploadFilesService {
  async upload(file, onUploadProgress) {
    let formData = new FormData();

    formData.append("file", file);
    return {
      data: {
        message: 'RAGANAME'
      }
    }
    // return http.post("/upload", formData, {
    //   headers: {
    //     "Content-Type": "multipart/form-data",
    //   },
    //   onUploadProgress,
    // });
  }
}

export default new UploadFilesService();
