import axios from "axios";
import {environment} from "../environments/environment.js";

export class ReportApiService {
    constructor() {
        this.baseUrl = environment.baseUrl;
    }

    // Reusable headers with auth token
    getAuthHeaders() {
        const token = localStorage.getItem("authToken");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    }


    // GET reports by user ID
    async getByUserId(userId) {
        try {
            return await axios.get(`${this.baseUrl}/reports/user/${userId}`, {
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error("Error fetching reports by user ID", error);
            return error.response;
        }
    }

    // GET all reports
    async getAll() {
        try {
            return await axios.get(`${this.baseUrl}/reports/`, {
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error("Error fetching all reports", error);
            return error.response;
        }
    }

    // POST create a new report
    async create(data) {
        try {
            return await axios.post(`${this.baseUrl}/reports/`, data, {
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error("Error creating report", error);
            return error.response;
        }
    }
}
