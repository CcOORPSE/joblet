import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import JobListing from '../components/JobListing'
import AppDownload from '../components/AppDownload'
import Footer from '../components/Footer'
import Calltoaction from '../components/Calltoaction'

const Home = () => {
  const location = useLocation();
  const { setShowRecruiterLogin } = useContext(AppContext);

  useEffect(() => {
    if (location.state?.openLogin) {
      setShowRecruiterLogin(true);
    }
  }, [location.state, setShowRecruiterLogin]);

  return (
    <div>
      <Navbar />
      <Hero />
      <JobListing /> 
      <AppDownload />
      <Calltoaction />
      <Footer />
    </div>
  )
}

export default Home
