import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

const getAllInterviewers = async (clientId = "") => {
  try {
    const { data: clientData, error: clientError } = await supabase.from("interviewer").select("*");

    if (clientError) {
      console.warn(`Supabase fetch failed, returning mock interviewers:`, clientError);
      return [
        {
          id: 1,
          name: "Jessica - HR Specialist",
          description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
          agent_id: "agent_hr_mock",
          empathy: 9,
          exploration: 7,
          rapport: 9,
          speed: 6,
        },
        {
          id: 2,
          name: "David - Senior Tech Lead",
          description: "Engages in core technical concepts, systems design, and problem solving.",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
          agent_id: "agent_tech_mock",
          empathy: 6,
          exploration: 9,
          rapport: 6,
          speed: 8,
        }
      ];
    }

    return clientData && clientData.length > 0 ? clientData : [
      {
        id: 1,
        name: "Jessica - HR Specialist",
        description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        agent_id: "agent_hr_mock",
        empathy: 9,
        exploration: 7,
        rapport: 9,
        speed: 6,
      },
      {
        id: 2,
        name: "David - Senior Tech Lead",
        description: "Engages in core technical concepts, systems design, and problem solving.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
        agent_id: "agent_tech_mock",
        empathy: 6,
        exploration: 9,
        rapport: 6,
        speed: 8,
      }
    ];
  } catch (error) {
    console.warn("Error, returning mock interviewers:", error);
    return [
      {
        id: 1,
        name: "Jessica - HR Specialist",
        description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        agent_id: "agent_hr_mock",
        empathy: 9,
        exploration: 7,
        rapport: 9,
        speed: 6,
      },
      {
        id: 2,
        name: "David - Senior Tech Lead",
        description: "Engages in core technical concepts, systems design, and problem solving.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
        agent_id: "agent_tech_mock",
        empathy: 6,
        exploration: 9,
        rapport: 6,
        speed: 8,
      }
    ];
  }
};

const createInterviewer = async (payload: any) => {
  // Check for existing interviewer with the same name
  const { data: existingInterviewer, error: checkError } = await supabase
    .from("interviewer")
    .select("*")
    .eq("name", payload.name)
    .filter("agent_id", "eq", payload.agent_id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking existing interviewer:", checkError);

    return null;
  }

  if (existingInterviewer) {
    console.error("An interviewer with this name already exists");

    return null;
  }

  const { error, data } = await supabase.from("interviewer").insert({ ...payload });

  if (error) {
    console.error("Error creating interviewer:", error);

    return null;
  }

  return data;
};

const getInterviewer = async (interviewerId: bigint) => {
  try {
    const { data: interviewerData, error: interviewerError } = await supabase
      .from("interviewer")
      .select("*")
      .eq("id", interviewerId)
      .single();

    if (interviewerError) {
      console.warn("Error fetching interviewer, using fallback:", interviewerError);
      return Number(interviewerId) === 1 ? {
        id: 1,
        name: "Jessica - HR Specialist",
        description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        agent_id: "agent_hr_mock",
        empathy: 9,
        exploration: 7,
        rapport: 9,
        speed: 6,
      } : {
        id: 2,
        name: "David - Senior Tech Lead",
        description: "Engages in core technical concepts, systems design, and problem solving.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
        agent_id: "agent_tech_mock",
        empathy: 6,
        exploration: 9,
        rapport: 6,
        speed: 8,
      };
    }

    return interviewerData;
  } catch (err) {
    return Number(interviewerId) === 1 ? {
      id: 1,
      name: "Jessica - HR Specialist",
      description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      agent_id: "agent_hr_mock",
      empathy: 9,
      exploration: 7,
      rapport: 9,
      speed: 6,
    } : {
      id: 2,
      name: "David - Senior Tech Lead",
      description: "Engages in core technical concepts, systems design, and problem solving.",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
      agent_id: "agent_tech_mock",
      empathy: 6,
      exploration: 9,
      rapport: 6,
      speed: 8,
    };
  }
};

export const InterviewerService = {
  getAllInterviewers,
  createInterviewer,
  getInterviewer,
};
