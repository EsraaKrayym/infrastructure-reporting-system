import { useEffect, useState } from "react";
import API from "../services/api";
import "./Accounts.css";

export default function Accounts() {
    const [users, setUsers] = useState([]);

    const loadUsers = async () => {
        const res = await API.get("/users");
        setUsers(res.data);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleBlock = async (id) => {
        await API.put(`/users/${id}/block`);
        loadUsers();
    };

    const handleDelete = async (id) => {
        await API.delete(`/users/${id}`);
        loadUsers();
    };

    return (
        <div className="accounts-container">
            <h2>Accounts</h2>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>

                <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                            {user.blocked ? "Blocked ❌" : "Active ✅"}
                        </td>
                        <td>
                            <button onClick={() => handleBlock(user.id)}>
                                Block / Unblock
                            </button>
                            <button onClick={() => handleDelete(user.id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}