import HomePage from '../views/home/home-page';
import AboutPage from '../views/about/about-page';
import LoginPage from '../views/login/login-page';
import RegisterPage from '../views/register/register-page';
import AddStoryPage from '../views/home/add-story-page';
import DetailStoryPage from '../views/home/detail-story-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/addstory': new AddStoryPage(),
  '/detailstory/:id': new DetailStoryPage(),
};

export default routes;
