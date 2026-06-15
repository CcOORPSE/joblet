import React, { useContext, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import { signInWithPopup } from "firebase/auth";
import { User, Mail, Lock, Eye, EyeOff, X, Upload, Sparkles, Shield, Briefcase } from "lucide-react";

const RecruiterLogin = () => {
  const navigate = useNavigate();
  const [roleTab, setRoleTab] = useState("candidate"); // "candidate" or "recruiter"
  const [state, setState] = useState("Login"); // "Login" or "Sign Up"
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(null);
  const [isTextDataSubmited, setIsTextDataSubmited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const dragAreaRef = useRef(null);

  const { setShowRecruiterLogin, backendUrl, setCompanyToken, setCompanyData } =
    useContext(AppContext);

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.add("border-brand-orange", "bg-orange-50/50");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove("border-brand-orange", "bg-orange-50/50");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove("border-brand-orange", "bg-orange-50/50");
    }
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
    } else {
      toast.error("Please upload an image file");
    }
  };

  const loginCandidateWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast.success(`Welcome back ${result.user.displayName}!`);
      setShowRecruiterLogin(false);
      navigate("/app/chat");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (roleTab === "recruiter" && state === "Sign Up" && !isTextDataSubmited) {
      if (passwordStrength < 3) {
        toast.warning("Please use a stronger password for better security");
        return;
      }
      return setIsTextDataSubmited(true);
    }

    setIsLoading(true);

    try {
      if (roleTab === "candidate") {
        if (state === "Login") {
          // Candidate Email Login
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          toast.success(`Welcome back ${userCredential.user.displayName || "Job Seeker"}!`);
          setShowRecruiterLogin(false);
          navigate("/app/chat");
        } else {
          // Candidate Email Sign Up
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: name });
          toast.success("Account created successfully!");
          setShowRecruiterLogin(false);
          navigate("/app/chat");
        }
      } else {
        // Recruiter Logic
        if (state === "Login") {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const idToken = await userCredential.user.getIdToken();
          
          const { data } = await axios.post(
            backendUrl + "/api/company/login",
            {},
            { headers: { Authorization: `Bearer ${idToken}` } }
          );

          if (data.success) {
            setCompanyData(data.company);
            setCompanyToken(idToken);
            localStorage.setItem("companyToken", idToken);
            toast.success("Recruiter login successful!");
            setShowRecruiterLogin(false);
            navigate("/dashboard");
          } else {
            toast.error(data.message || "Recruiter login failed.");
          }
        } else {
          // Recruiter Sign Up
          const formData = new FormData();
          formData.append("name", name);
          formData.append("password", password);
          formData.append("email", email);
          if (image) {
            formData.append("image", image);
          }

          const { data } = await axios.post(
            backendUrl + "/api/company/register",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          
          if (data.success) {
            const userCredential = await signInWithCustomToken(auth, data.token);
            const idToken = await userCredential.user.getIdToken();
            
            const loginRes = await axios.post(
              backendUrl + "/api/company/login",
              {},
              { headers: { Authorization: `Bearer ${idToken}` } }
            );

            if (!loginRes.data.success) {
              throw new Error(loginRes.data.message || "Could not complete recruiter sign-in");
            }

            setCompanyData(loginRes.data.company);
            setCompanyToken(idToken);
            localStorage.setItem("companyToken", idToken);
            toast.success("Recruiter account registered!");
            setShowRecruiterLogin(false);
            navigate("/dashboard");
          } else {
            const msg = data.message || "Registration failed.";
            if (data.setupRequired === "firebase_storage") {
              toast.error("Firebase Storage is not set up. See docs/03-recruiter-storage-setup.md", {
                autoClose: 8000,
              });
              console.error("Storage setup required:\n", msg);
            } else {
              toast.error(msg.split("\n")[0] || msg);
            }
          }
        }
      }
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || error.message || "An error occurred.";
      if (data?.setupRequired === "firebase_storage") {
        toast.error("Firebase Storage is not set up. Enable it in Firebase Console (see server logs for steps).", {
          autoClose: 8000,
        });
        console.error("Storage setup required:\n", msg);
      } else {
        toast.error(msg.split("\n")[0] || msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setImage(null);
    setIsTextDataSubmited(false);
    setPasswordStrength(0);
  };

  const switchMode = (newState) => {
    setState(newState);
    resetForm();
  };

  const switchRole = (newRole) => {
    setRoleTab(newRole);
    resetForm();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="relative w-full max-w-lg p-1"
        initial={{ y: 30, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
      >
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100">
          
          {/* Header Area */}
          <div className="relative h-28 bg-gradient-to-r from-brand-navy to-brand-blue flex flex-col justify-end p-6">
            <h1 className="text-xl font-extrabold text-white">
              {roleTab === "candidate" ? "Candidate Portal" : "Employer Dashboard"}
            </h1>
            <p className="text-xs text-white/70">
              {state === "Login" ? "Sign in to access premium tools" : "Join today for direct portal features"}
            </p>
          </div>

          {/* Role Switching Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => switchRole("candidate")}
              className={`flex-1 py-4 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                roleTab === "candidate" 
                  ? "bg-white text-brand-orange border-b-2 border-brand-orange" 
                  : "text-gray-500 hover:text-brand-navy"
              }`}
            >
              <Briefcase size={16} />
              I'm a Candidate
            </button>
            <button
              onClick={() => switchRole("recruiter")}
              className={`flex-1 py-4 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                roleTab === "recruiter" 
                  ? "bg-white text-brand-orange border-b-2 border-brand-orange" 
                  : "text-gray-500 hover:text-brand-navy"
              }`}
            >
              <Shield size={16} />
              I'm a Recruiter
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={`${state}-${roleTab}-${isTextDataSubmited}`}
              onSubmit={onSubmitHandler}
              className="p-8 space-y-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {roleTab === "recruiter" && state === "Sign Up" && isTextDataSubmited ? (
              <div className="flex flex-col items-center my-4">
                  <div 
                    ref={dragAreaRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="relative w-36 h-36 mb-2 overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-orange bg-gray-50 flex items-center justify-center cursor-pointer transition-all duration-200"
                  >
                    {image ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(image)}
                          alt="Company Logo Preview"
                          className="object-cover w-full h-full"
                        />
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() => setImage(null)}
                        >
                          <X size={20} className="text-white" />
                          <span className="text-[10px] font-bold text-white mt-1">Remove</span>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 text-center">
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-xs font-bold text-brand-navy">Upload Brand Logo</span>
                        <span className="text-[10px] text-gray-400 mt-1">Optional</span>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && setImage(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">You can add a logo now or update it later from your dashboard</p>
                </div>
              ) : (
                <>
                  {state !== "Login" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-navy block">
                        {roleTab === "candidate" ? "Your Full Name" : "Company / Business Name"}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <User size={16} />
                        </span>
                        <input
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange transition-all"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          type="text"
                          placeholder={roleTab === "candidate" ? "Enter your name" : "Enter company name"}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-navy block">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Mail size={16} />
                      </span>
                      <input
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-navy block">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Lock size={16} />
                      </span>
                      <input
                        className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange transition-all"
                        value={password}
                        onChange={handlePasswordChange}
                        type={showPassword ? "text" : "password"}
                        placeholder={state === "Login" ? "Enter password" : "Create password"}
                        required
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 text-xs font-bold text-white transition-all bg-gradient-to-r from-brand-orange to-orange-600 hover:from-brand-orange/95 hover:to-orange-700 rounded-xl focus:outline-none shadow-md hover:shadow-lg disabled:opacity-75"
              >
                {isLoading ? "Please wait..." : state === "Login" ? "Sign In" : roleTab === "recruiter" && !isTextDataSubmited ? "Continue" : "Create Account"}
              </button>

              {roleTab === "candidate" && state === "Login" && (
                <div className="space-y-4">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold tracking-wider uppercase">Or login instantly</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  <button
                    type="button"
                    onClick={loginCandidateWithGoogle}
                    className="w-full py-3 border border-gray-200 hover:bg-gray-50/80 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-brand-navy shadow-sm transition-all"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              )}
            </motion.form>
          </AnimatePresence>

          {/* Bottom account switch */}
          <div className="py-4 bg-gray-50 border-t border-gray-100 flex justify-center text-xs">
            <span className="text-gray-500 font-medium">
              {state === "Login" ? "Need an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(state === "Login" ? "Sign Up" : "Login")}
                className="font-bold text-brand-orange hover:text-brand-orange/85 transition-colors"
              >
                {state === "Login" ? "Register Now" : "Sign In"}
              </button>
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowRecruiterLogin(false)}
            className="absolute top-4 right-4 p-1.5 text-white/80 transition-colors rounded-full hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecruiterLogin;