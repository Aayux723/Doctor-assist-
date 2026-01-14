import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* TEMP MOCK DATA (UI FIRST) */
const chartData = [
  { day: "Mon", count: 2 },
  { day: "Tue", count: 4 },
  { day: "Wed", count: 3 },
  { day: "Thu", count: 5 },
  { day: "Fri", count: 1 },
];

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/patients");
        setPatients(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const nextAppointment = {
  time: "3:30 PM",
  patient: "Rahul Sharma",
};


  /* LOADING STATE */
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  /* MAIN DASHBOARD */
  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your clinic activity
            </p>
          </div>
          <Button onClick={() => navigate("/patients/new")}>
            + Add Patient
          </Button>
        </div>

        {/* STATS */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Total Patients</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold tracking-tight">
                {patients.length}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Appointments Today</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold tracking-tight">
                0
              </CardContent>
            </Card>

            <Card className="shadow-sm">
           <CardHeader>
              <CardTitle>Next Appointment</CardTitle>
           </CardHeader>
           <CardContent>
          {nextAppointment ? (
              <div className="space-y-1">
               <p className="text-2xl font-bold">
               {nextAppointment.time}
              </p>
             <p className="text-muted-foreground">
              {nextAppointment.patient}
        </p>
      </div>
    ) : (
      <p className="text-muted-foreground">
        No upcoming appointments
      </p>
    )}
  </CardContent>
</Card>

          </div>
        </section>

     


        {/* RECENT PATIENTS */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Recent Patients</h2>
          <Card className="shadow-sm">
            <CardContent className="pt-4">
              {patients.length === 0 ? (
                <p className="text-muted-foreground">No patients found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.slice(0, 5).map((p) => (
                      <TableRow
                        key={p.patient_id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() =>
                          navigate(`/patients/${p.patient_id}`)
                        }
                      >
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.age ?? "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>

        {/* CHART */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Appointments This Week</h2>
          <Card className="shadow-sm">
            {/* 👇 HEIGHT IS CRITICAL */}
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}



