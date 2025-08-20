// Utility functions for managing student quiz data in localStorage

export interface QuizResult {
  topicId: string;
  topicName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

export interface StudentData {
  matricNumber: string;
  results: QuizResult[];
}

const STORAGE_KEY = "student_quiz_data";

export const saveStudentResult = (matricNumber: string, result: QuizResult): void => {
  try {
    const existingData = getStudentData(matricNumber);
    
    // Update or add the result
    const updatedResults = existingData.results.filter(r => r.topicId !== result.topicId);
    updatedResults.push(result);
    updatedResults.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    const studentData: StudentData = {
      matricNumber,
      results: updatedResults
    };

    // Get all students data
    const allData = getAllStudentsData();
    const updatedAllData = allData.filter(s => s.matricNumber !== matricNumber);
    updatedAllData.push(studentData);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllData));
  } catch (error) {
    console.warn("Failed to save quiz result to localStorage:", error);
  }
};

export const getStudentData = (matricNumber: string): StudentData => {
  try {
    const allData = getAllStudentsData();
    const studentData = allData.find(s => s.matricNumber === matricNumber);
    
    if (studentData) {
      return studentData;
    }
    
    return {
      matricNumber,
      results: []
    };
  } catch (error) {
    console.warn("Failed to get student data from localStorage:", error);
    return {
      matricNumber,
      results: []
    };
  }
};

export const getAllStudentsData = (): StudentData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn("Failed to get all students data from localStorage:", error);
    return [];
  }
};

export const clearStudentData = (matricNumber: string): void => {
  try {
    const allData = getAllStudentsData();
    const filteredData = allData.filter(s => s.matricNumber !== matricNumber);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData));
  } catch (error) {
    console.warn("Failed to clear student data from localStorage:", error);
  }
};

export const initializeWithMockData = (matricNumber: string): void => {
  const existingData = getStudentData(matricNumber);
  
  // Only initialize with mock data if student has no existing results
  if (existingData.results.length === 0) {
    const mockResults: QuizResult[] = [
      {
        topicId: "topic1",
        topicName: "Problem-Solving & Computing",
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        completedAt: "2025-08-10T10:30:00Z"
      },
      {
        topicId: "topic2", 
        topicName: "Algorithms & Flowcharts",
        score: 9,
        totalQuestions: 10,
        percentage: 90,
        completedAt: "2025-08-11T14:15:00Z"
      }
    ];

    // Save mock results for demo purposes
    mockResults.forEach(result => {
      saveStudentResult(matricNumber, result);
    });
  }
};
