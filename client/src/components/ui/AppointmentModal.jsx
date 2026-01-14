import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ---------- helpers ---------- */
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN");

const formatTime = (time) => time?.slice(0, 5) || "—";

export default function AppointmentModal({
  open,
  onClose,
  appointment,
  onComplete,
  onReschedule,
}) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          max-w-lg
          max-h-[90vh]
          overflow-y-auto
          bg-white
          text-black
          border
          shadow-xl
          selection:bg-transparent
          selection:text-inherit
        "
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Appointment Details
          </DialogTitle>
        </DialogHeader>

        {/* PATIENT */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Patient
          </p>
          <p className="font-medium">{appointment.patient_name}</p>
        </div>

        {/* DATE + TIME */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Date
            </p>
            <p>{formatDate(appointment.appointment_date)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Time
            </p>
            <p>{formatTime(appointment.appointment_time)}</p>
          </div>
        </div>

        {/* STATUS */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Status
          </p>
          <div className="mt-1">
            <Badge
              variant={
                appointment.status === "completed"
                  ? "secondary"
                  : appointment.status === "cancelled"
                  ? "destructive"
                  : "default"
              }
            >
              {appointment.status}
            </Badge>
          </div>
        </div>

        {/* DIAGNOSIS */}
        {appointment.diagnosis_text && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Diagnosis
            </p>
            <p className="mt-1 text-sm">
              {appointment.diagnosis_text}
            </p>
          </div>
        )}

        {/* INSTRUCTIONS */}
        {appointment.instructions && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Instructions
            </p>
            <p className="mt-1 text-sm">
              {appointment.instructions}
            </p>
          </div>
        )}

        {/* MEDICATIONS */}
        {appointment.medications?.length > 0 && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Medications
            </p>

            <ul className="mt-3 space-y-3">
              {appointment.medications.map((m, idx) => (
                <li
                  key={idx}
                  className="rounded-md border bg-gray-50 p-3 text-sm"
                >
                  <p className="font-medium">{m.medicine_name}</p>
                  <p className="text-muted-foreground">
                    {m.dosage} · {m.frequency} · {m.duration}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-8">
          {appointment.status === "scheduled" && (
            <>
              <Button
                variant="outline"
                onClick={() => onReschedule(appointment)}
              >
                Reschedule
              </Button>

              <Button
                onClick={() =>
                  onComplete(appointment.appointment_id)
                }
              >
                Mark Completed
              </Button>
            </>
          )}

          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
