import AuthModel from "../../models/auth-model";

export default class LoginPagePresenter {
  constructor(view) {
    this.view = view;
  }

  async init() {
    try {
      this.view.addSubmitListener(this.handleLoginSubmit.bind(this));
    } catch (error) {
      console.error("Initialization error:", error);
    }
  }

  async handleLoginSubmit(event) {
    event.preventDefault();
    const formData = this.view.getFormData();
    const { email, password } = formData;

    this.view.hideErrorMessage();

    try {
      this.view.setLoadingState(true);

      await AuthModel.login(email, password);

      window.location.hash = "#/";

    } catch (error) {
      this.view.setErrorMessage(error.message);
    } finally {
      this.view.setLoadingState(false);
    }
  }
}
