import StoryModel from "../../models/story-model";
import AuthModel from "../../models/auth-model";
export default class AddStoryPresenter {
  constructor(view) {
    this.view = view;
    this.cameraStream = null;
    this.capturedPhotoBlob = null;
    this.isOffline = !navigator.onLine;
  
    window.addEventListener('online', () => {
      console.log('Add story page - Online status changed: ONLINE');
      this.isOffline = false;
      this.view.updateOfflineStatus(false);
    });
    
    window.addEventListener('offline', () => {
      console.log('Add story page - Online status changed: OFFLINE');
      this.isOffline = true;
      this.view.updateOfflineStatus(true);
    });
  }

  async init() {
    try {
      if (this.isOffline) {
        this.view.updateOfflineStatus(true);
      }
      
      this.view.addCaptureButtonListener(
        this.handleCaptureButtonClick.bind(this)
      );
      this.view.addFormSubmitListener(this.handleFormSubmit.bind(this));

      if (!this.isOffline) {
        await this.initCamera();
      }

      window.addEventListener("beforeunload", this.cleanupCamera.bind(this));

      window.addEventListener("hashchange", this.cleanupCamera.bind(this));
    } catch (error) {
      console.error("Init error:", error);
      this.view.showError("Terjadi kesalahan saat menginisialisasi halaman: " + error.message);
    }
  }
  
  async initCamera() {
    try {
      const video = document.getElementById("camera-stream");
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      video.srcObject = this.cameraStream;
    } catch (error) {
      console.error("Camera access error:", error);
      this.view.showError("Tidak dapat mengakses kamera. Mohon periksa izin kamera anda.");
    }
  }

  handleCaptureButtonClick = async () => {
    if (this.isOffline) {
      this.view.showError("Tidak dapat mengambil foto saat offline");
      return;
    }
    
    try {
      this.capturedPhotoBlob = await this.view.capturePhoto();

      if (!this.capturedPhotoBlob || this.capturedPhotoBlob.size === 0) {
        throw new Error("Failed to capture photo - empty result");
      }

      this.view.displayCapturedPhoto(this.capturedPhotoBlob);

      document.getElementById("photo").value = "";

      this.cleanupCamera();
    } catch (error) {
      console.error("Capture failed:", error);
      this.view.showError("Gagal mengambil foto: " + error.message);
      this.capturedPhotoBlob = null;
    }
  };

  handleFormSubmit = async (event) => {
    event.preventDefault();
    
    if (this.isOffline) {
      this.view.showError("Tidak dapat menambahkan story saat offline. Silakan coba lagi saat terhubung ke internet.");
      return;
    }

    try {
      const formData = this.view.getFormData();

      if (!formData.description || formData.description.length < 3) {
        throw new Error("Deskripsi harus diisi (minimal 3 karakter)");
      }

      if (!formData.photo) {
        throw new Error("Harap ambil foto atau upload gambar");
      }

      if (AuthModel.isUserLoggedIn()) {
        await StoryModel.addStory(formData);
      } else {
        await StoryModel.addStoryGuest(formData);
      }

      this.view.showSuccess("Story berhasil ditambahkan!");
      window.location.hash = "#/";
    } catch (error) {
      console.error("Error:", error);
      this.view.showError(`Gagal: ${error.message}`);
    }
  };

  cleanupCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.cameraStream = null;
      console.log("Kamera berhasil dimatikan.");
    }
  }
}
