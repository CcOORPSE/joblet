import { Navigate } from "react-router-dom";

/** Legacy route — applicant chat lives at /app/chat */
const Chatbot = () => <Navigate to="/app/chat" replace />;

export default Chatbot;
