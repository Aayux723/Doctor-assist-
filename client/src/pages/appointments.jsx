import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import AppointmentModal from "@/components/ui/AppointmentModal";

/* ---------- helpers ---------- */
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN");

const formatTime = (time) => time?.slice(0, 5) || "—";

const statusBadge = (status) => {
  switch (status) {
    case "completed":
      return <Badge variant="secondary">Completed</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge>Scheduled</Badge>;
  }
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();

  /* ---------- fetch list ---------- */
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data || []);
    } catch (err) {
      console.error("FETCH APPOINTMENTS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  /* ---------- fetch details ---------- */
  const openDetails = async (appointmentId) => {
    try {
      const res = await api.get(`/appointments/${appointmentId}/details`);
      setSelected(res.data);
      setModalOpen(true);
    } catch (err) {
      console.error("FETCH DETAILS ERROR:", err);
    }
  };

  /* ---------- actions ---------- */
  const markCompleted = async (id) => {
    await api.patch(`/appointments/${id}/complete`);
    setModalOpen(false);
    fetchAppointments();
  };

  const cancelAppointment = async (id) => {
    await api.patch(`/appointments/${id}/cancel`);
    setModalOpen(false);
    fetchAppointments();
  };

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Button onClick={() => navigate("/appointments/new")}>
          + Add Appointment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
        </CardHeader>

        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground">No appointments found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.appointment_id}>
                    <TableCell className="font-medium">
                      {a.patient_name}
                    </TableCell>

                    <TableCell>{formatDate(a.appointment_date)}</TableCell>
                    <TableCell>{formatTime(a.appointment_time)}</TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetails(a.appointment_id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <AppointmentModal
        open={modalOpen}
        appointment={selected}
        onClose={() => setModalOpen(false)}
        onComplete={markCompleted}
        onCancel={cancelAppointment}
      />
    </div>
  );
}

