import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

axios.defaults.withCredentials = true;

export interface Task {
    id: number;
    title: string;
    body: string;
    status: number;
    team_id: number;
    assignee_id: number;
    created_at?: string;
    updated_at?: string;
}

export type CreateTaskData = Pick<Task, 'title'> & Partial<Pick<Task, 'team_id' | 'body' | 'assignee_id' | 'status'>>;

export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
    const response = await axios.post<Task>(`${API_BASE_URL}/tasks`, { task: taskData });
    return response.data;
};

export const getTasks = async (): Promise<Task[]> => {
    const response = await axios.get<Task[]>(`${API_BASE_URL}/tasks`);
    return response.data;
};

export const getTask = async (id: number): Promise<Task> => {
    const response = await axios.get<Task>(`${API_BASE_URL}/tasks/${id}`);
    return response.data;
};

export type UpdateTaskData = Partial<Pick<Task, 'title' | 'body' | 'team_id' | 'assignee_id' | 'status'>>;

export const updateTask = async (id: number, taskData: UpdateTaskData): Promise<Task> => {
    const response = await axios.put<Task>(`${API_BASE_URL}/tasks/${id}`, { task: taskData });
    return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/tasks/${id}`);
};