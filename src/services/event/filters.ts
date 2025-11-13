import { PaginatedResponse } from "@src/interfaces/common/PaginatedResponse";
import { EventResponse } from "@src/interfaces/event/EventResponse";
import loaderEnv from "@src/utils/loaderEnv";

const API_URL = loaderEnv("BACKEND_URL") + "/api/event";


export const getFarthest = async (): Promise<EventResponse> => {
    const res = await fetch(`${API_URL}/filtered?currentPage=0&pageSize=1&sortByDate=farthest`);
    if (!res.ok) {
        throw new Error("Error fetching farthest event");
    }

    const data: PaginatedResponse<EventResponse> = await res.json();
    return data.content[0];
}

export const getNearestConcert = async (): Promise<EventResponse[]> => {
    const res = await fetch(`${API_URL}/filtered?currentPage=0&pageSize=4&type=CONCIERTO&sortByDate=nearest`);
    if (!res.ok) {
        throw new Error("Error fetching nearest concert");
    }
    const data: PaginatedResponse<EventResponse> = await res.json();
    return data.content;
}


export const getNearestConference = async (): Promise<EventResponse[]> => {
    const res = await fetch(`${API_URL}/filtered?currentPage=0&pageSize=4&type=CONFERENCIA&sortByDate=nearest`);
    if (!res.ok) {
        throw new Error("Error fetching nearest conferences");
    }
    const data: PaginatedResponse<EventResponse> = await res.json();
    return data.content;
}