import { useState, useEffect } from "react";
import { Survey, SurveyResponse } from "../types/survey";
import { useAuth } from "@/hooks/useAuth";

export const useSurveys = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSurveys = async () => {
    if (!user?.schoolCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/surveys?schoolCode=${user.schoolCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch surveys");
      }

      const data = await response.json();
      setSurveys(data.surveys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createSurvey = async (surveyData: Partial<Survey>) => {
    if (!user?.schoolCode) throw new Error("User not authenticated");

    const response = await fetch("/api/surveys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-domain": window.location.host,
      },
      body: JSON.stringify({
        ...surveyData,
        schoolCode: user.schoolCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create survey");
    }

    const data = await response.json();
    setSurveys(prev => [data.survey, ...prev]);
    return data.survey;
  };

  const updateSurvey = async (surveyId: string, updates: Partial<Survey>) => {
    const response = await fetch("/api/surveys", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-domain": window.location.host,
      },
      body: JSON.stringify({
        surveyId,
        ...updates,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update survey");
    }

    setSurveys(prev =>
      prev.map(survey =>
        survey._id === surveyId ? { ...survey, ...updates } : survey
      )
    );
  };

  const deleteSurvey = async (surveyId: string) => {
    const response = await fetch(`/api/surveys?surveyId=${surveyId}`, {
      method: "DELETE",
      headers: {
        "x-domain": window.location.host,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete survey");
    }

    setSurveys(prev => prev.filter(survey => survey._id !== surveyId));
  };

  const duplicateSurvey = async (surveyId: string) => {
    if (!user?.schoolCode) throw new Error("User not authenticated");

    const response = await fetch("/api/surveys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-domain": window.location.host,
      },
      body: JSON.stringify({
        duplicateFromId: surveyId,
        schoolCode: user.schoolCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to duplicate survey");
    }

    const data = await response.json();
    setSurveys(prev => [data.survey, ...prev]);
    return data.survey;
  };

  useEffect(() => {
    fetchSurveys();
  }, [user?.schoolCode]);

  return {
    surveys,
    loading,
    error,
    fetchSurveys,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    duplicateSurvey,
  };
};

export const useSurveyResponses = (surveyId: string) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = async () => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/surveys/responses?surveyId=${surveyId}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch responses");
      }

      const data = await response.json();
      setResponses(data.responses || []);
      setSurvey(data.survey || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (responses: { answer: unknown }[]) => {
    const response = await fetch("/api/surveys/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-domain": window.location.host,
      },
      body: JSON.stringify({
        surveyId,
        responses,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit response");
    }

    // Refresh responses after submission
    await fetchResponses();
  };

  useEffect(() => {
    fetchResponses();
  }, [surveyId]);

  return {
    responses,
    survey,
    loading,
    error,
    fetchResponses,
    submitResponse,
  };
};

export const useSurvey = (surveyId: string) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSurvey = async () => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch survey");
      }

      const data = await response.json();
      setSurvey(data.survey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  return {
    survey,
    loading,
    error,
    refetch: fetchSurvey,
  };
}; 