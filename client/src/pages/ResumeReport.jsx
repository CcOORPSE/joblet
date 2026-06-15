import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Summary from '../components/Summary';
import ATS from '../components/ATS';
import Details from '../components/Details';

const ResumeReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchResumeDetail, user } = useContext(AppContext);
    
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getReport = async () => {
            setIsLoading(true);
            const data = await fetchResumeDetail(id);
            if (data) {
                setAnalysis(data);
            } else {
                navigate('/resume-analyzer');
            }
            setIsLoading(false);
        };
        getReport();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-jl-bg flex items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-500">Loading your AI Analysis Grade...</p>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="min-h-screen bg-[url('/images/bg-small.svg')] bg-cover bg-slate-50/50 flex flex-col">
            {/* Nav Back Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
                <Link to="/resume-analyzer" className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 bg-white p-2.5 rounded-xl shadow-sm text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]">
                    <img src="/icons/back.svg" alt="back" className="w-3.5 h-3.5 object-contain" />
                    <span>Back to Analyzer</span>
                </Link>

                <div className="text-right">
                    <h2 className="text-sm font-extrabold text-slate-800">
                        {analysis.jobTitle || 'General Scan'}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {analysis.companyName ? `@ ${analysis.companyName}` : 'Personal Assessment'}
                    </p>
                </div>
            </header>

            {/* Split Main Content Area */}
            <main className="flex-1 flex flex-col lg:flex-row w-full gap-6 p-4 sm:p-6 max-w-7xl mx-auto !pt-4">
                {/* Left Side: PDF Embed Viewer */}
                <section className="w-full lg:w-5/12 h-[350px] lg:h-[80vh] lg:sticky lg:top-24 bg-white border border-slate-100 rounded-3xl p-4 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <span className="text-sm font-extrabold text-slate-700">Uploaded Resume</span>
                        <a 
                            href={analysis.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-brand-orange hover:underline"
                        >
                            Open in New Tab &rarr;
                        </a>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden shadow-inner">
                        <iframe 
                            src={analysis.resumeUrl} 
                            title="Resume PDF Document" 
                            className="w-full h-full border-none"
                        />
                    </div>
                </section>

                {/* Right Side: AI Feedbacks Scroll Grid */}
                <section className="w-full lg:w-7/12 flex flex-col gap-6 overflow-y-auto">
                    <Summary feedback={analysis.feedback} />
                    
                    <ATS 
                        score={analysis.feedback?.ATS?.score || 0} 
                        suggestions={analysis.feedback?.ATS?.tips || []} 
                    />
                    
                    <Details feedback={analysis.feedback} />
                </section>
            </main>
        </div>
    );
};

export default ResumeReport;
