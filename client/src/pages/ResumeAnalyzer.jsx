import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import FileUploader from '../components/FileUploader';

const ResumeAnalyzer = () => {
    const { analyzeResume, fetchUserResumes, user } = useContext(AppContext);
    const navigate = useNavigate();
    
    const [file, setFile] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [pastAnalyses, setPastAnalyses] = useState([]);
    const [isLoadingPast, setIsLoadingPast] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            if (user) {
                setIsLoadingPast(true);
                const history = await fetchUserResumes();
                setPastAnalyses(history || []);
                setIsLoadingPast(false);
            }
        };
        loadHistory();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsProcessing(true);
        setStatusText('Uploading resume and extracting parameters...');

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('companyName', companyName);
        formData.append('jobTitle', jobTitle);
        formData.append('jobDescription', jobDescription);

        setStatusText('Analyzing content compatibility with target job...');
        const analysisId = await analyzeResume(formData);
        
        if (analysisId) {
            setStatusText('Analysis complete! Preparing report...');
            setTimeout(() => {
                navigate(`/resume-analyzer/report/${analysisId}`);
            }, 1000);
        } else {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover bg-center py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-10">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-orange via-orange-500 to-orange-600">
                        Smart AI Resume Analyzer
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Instantly score your resume against automated ATS filters, tone benchmarks, and get tailormade optimization tips.
                    </p>
                </div>

                {/* Form or Scanning Section */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/50">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-6 text-center animate-pulse">
                            <h2 className="text-2xl font-bold text-slate-800">{statusText}</h2>
                            <div className="relative w-64 max-w-full rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 p-2">
                                <img src="/images/resume-scan.gif" alt="scanning" className="w-full h-auto rounded-xl object-contain" />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="company-name" className="text-sm font-bold text-slate-600">Company Name (Optional)</label>
                                    <input 
                                        type="text" 
                                        id="company-name"
                                        placeholder="e.g. Google, Stripe"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 rounded-xl outline-none transition-all text-sm text-slate-700"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="job-title" className="text-sm font-bold text-slate-600">Job Title (Optional)</label>
                                    <input 
                                        type="text" 
                                        id="job-title"
                                        placeholder="e.g. Frontend Developer"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 rounded-xl outline-none transition-all text-sm text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="job-description" className="text-sm font-bold text-slate-600">Job Description (Optional)</label>
                                <textarea 
                                    id="job-description"
                                    rows={4}
                                    placeholder="Paste target job responsibilities or qualifications to tailor AI analysis insights..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 rounded-xl outline-none transition-all text-sm text-slate-700 resize-y"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-slate-600">Upload PDF Resume</label>
                                <FileUploader onFileSelect={setFile} />
                            </div>

                            <button 
                                type="submit" 
                                disabled={!file}
                                className={`w-full py-4 text-center rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
                                    file 
                                        ? 'bg-gradient-to-r from-brand-orange to-orange-600 hover:from-brand-orange/95 hover:to-orange-700 shadow-brand-orange/20 hover:shadow-brand-orange/30 cursor-pointer active:scale-[0.98]' 
                                        : 'bg-slate-300 cursor-not-allowed shadow-none'
                                }`}
                            >
                                Analyze Resume Now
                            </button>
                        </form>
                    )}
                </div>

                {/* History Section */}
                {user && (
                    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/50 flex flex-col gap-5">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-xl font-extrabold text-slate-800">Your Past Analyses</h3>
                            <p className="text-sm text-slate-400">Instantly reload any previously scanned report profiles</p>
                        </div>

                        {isLoadingPast ? (
                            <div className="flex justify-center items-center py-10">
                                <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : pastAnalyses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {pastAnalyses.map((item) => (
                                    <Link 
                                        key={item.id} 
                                        to={`/resume-analyzer/report/${item.id}`}
                                        className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200 rounded-2xl transition-all shadow-sm group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                                                <span className="text-sm font-black text-brand-orange">{item.feedback?.overallScore || '?'}%</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-slate-700 truncate max-w-[160px] sm:max-w-[200px]">
                                                    {item.jobTitle || 'General Scan'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {item.companyName ? `@ ${item.companyName}` : 'No target company'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-brand-orange text-xs font-semibold group-hover:translate-x-1 transition-transform">
                                            View &rarr;
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                No resumes scanned yet. Start by uploading one above!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeAnalyzer;
