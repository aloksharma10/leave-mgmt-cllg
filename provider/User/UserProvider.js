"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import { redirect } from "next/navigation";

import { useToast } from "@/components/ui/use-toast";
import { signIn, signOut, useSession } from "next-auth/react";

import {
  applyLeave,
  deleteLeave,
  getUserLeaveReport,
} from "@/actions/userLeaveActions";
import { userSignup } from "@/actions/userAction";
import { generateReportPDF, sendMail } from "@/actions/genrateReport";
import {
  approveLeave,
  approveUser,
  deleteUser,
  disapproveUser,
  getAdminLeaveReport,
  updateLeavePolicy,
} from "@/actions/adminLeaveActions";
import { differenceInMonths } from "date-fns";

function UserProvider({ children }) {
  const { toast } = useToast();

  const [user, setUser] = useState({});

  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session]);

  const handleUserSignup = useCallback(
    async (formData) => {
      const name = formData.get("name");
      const role = formData.get("role");
      const email = formData.get("email");
      const phone = formData.get("phone");
      const password = formData.get("password");
      if (name.length > 2 && role && email.includes("@") && phone && password) {
        const { status } = await userSignup(formData);
        if (status == 200) {
          toast({
            className: "bg-black text-white",
            title: "Success",
            description: "Your signup request has been submitted for approval.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Please enter the valid details!",
        });
      }
    },
    [toast]
  );

  const handleUserLogin = useCallback(
    async (formData) => {
      const email = formData.get("email");
      const password = formData.get("password");
      const role = formData.get("role");

      const userData = {
        email: email,
        password: password,
        role: role,
      };
      if (role && email.includes("@") && password) {
        const { error } = await signIn("credentials", {
          ...userData,
          redirect: false,
        });

        switch (error) {
          case "User not found!":
            toast({
              variant: "destructive",
              title: "Invalid Credentials!",
            });
            break;
          case "Invalid Credentials!":
            toast({
              variant: "destructive",
              title: "Invalid Credentials!",
            });
            break;
          case "waiting for approval!":
            toast({
              variant: "destructive",
              title: "Your profile is currently in the queue for approval!",
            });
            break;
          default:
            toast({
              className: "bg-black text-white",
              title: "Login successfully!",
            });
            redirect(
              role.toLowerCase() == "admin" ? "/admin" : "/user",
              "push"
            );
            break;
        }
      } else {
        toast({
          variant: "destructive",
          title: "Please enter the valid details!",
        });
      }
    },
    [toast]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setUser({});
      toast({
        className: "bg-black text-white",
        title: "Success",
        description: "Logout successfully!",
      });
    } catch (error) {
      console.log("error", error);
      toast({
        variant: "destructive",
        title: "Something went wrong!",
      });
    }
  }, [toast]);

  const handleApplyLeave = useCallback(
    async (formData, date) => {
      const title = formData.get("title");
      const message = formData.get("message");
      if (title.length < 5 || title.length > 30) {
        return toast({
          variant: "destructive",
          title: "Ttile should not be less than 5 and more than 30 characters!",
        });
      }
      if (5 < title.length < 30 && date.to > date.from) {
        const reqLeaveFormData = {
          title,
          startDate: date.from,
          endDate: date.to,
          message,
          userId: user.id,
        };
        const { status } = await applyLeave(reqLeaveFormData);
        if (status == 200) {
          toast({
            className: "bg-black text-white",
            title: "Success",
            description: "Your leave request has been submitted for approval.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Start date and end date must not be same!",
        });
      }
    },
    [toast, user.id]
  );

  const handleUserMonthlyReport = useCallback(
    async (date) => {
      try {
        const reportStartDate = new Date(date.from).toISOString().split("T")[0];
        const reportEndDate = new Date(date.to).toISOString().split("T")[0];
        const res = await getUserLeaveReport(
          user.id,
          reportStartDate,
          reportEndDate
        );
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `You are viewing the latest leave report ${reportStartDate} to ${reportEndDate}`,
        });

        return res;
      } catch (error) {
        return [];
      }
    },
    [toast, user.id]
  );

  const handleLeaveDelete = useCallback(
    async (leaveId) => {
      try {
        const res = await deleteLeave(leaveId, user.id);
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `Leave deleted successfully`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: `Failed to delete leave`,
        });
      }
    },
    [toast, user.id]
  );

  const handleSendReport = useCallback(
    async (reportData, date) => {
      try {
        if (reportData?.length == 0 || reportData == undefined) {
          return toast({
            variant: "destructive",
            title: "Unsufficient data",
            description: `No data found to send report`,
          });
        }
        const approvedLeave = reportData.filter(
          (leave) => leave.status == "approved"
        );
        if (approvedLeave.length == 0) {
          return toast({
            variant: "destructive",
            title: "Unsufficient data",
            description: `No approved leave found to send report`,
          });
        }
        const sendReport = await generateReportPDF(approvedLeave, date, {
          name: user.name,
          email: user.email,
          role: user.role === "admin" ? "admin" : "user",
        });
       
   
       console.log("mail",sendReport);

       toast({
        className: "bg-black text-white",
        title: "Report sent on your email successfully!",
      });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: `Failed to Send Report`,
        });
      }
    },
    [toast, user.email, user.name, user.role]
  );

  const handleUserApproval = useCallback(
    async (userId) => {
      try {
        const res = await approveUser(userId);
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `User approved successfully`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: `Failed to approve user`,
        });
      }
    },
    [toast]
  );

  const handleUserDelete = useCallback(
    async (userId) => {
      try {
        const res = await deleteUser(userId);
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `User deleted successfully`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: `Failed to delete user`,
        });
      }
    },
    [toast]
  );

  const handleUserDisapprove = useCallback(
    async (userId) => {
      try {
        const res = await disapproveUser(userId);
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `User disapproved successfully`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: `Failed to disapprove user`,
        });
      }
    },
    [toast]
  );

  const handleUpdatLeavePolicy = useCallback(
    async (formData, date) => {
      try {
        const monthsBetween = differenceInMonths(date.to, date.from);

        console.log("formData", formData);
        const monthsArray = [];

        for (let i = 0; i <= monthsBetween; i++) {
          const newMonth = new Date(date.from);
          newMonth.setMonth(date.from.getMonth() + i);
          monthsArray.push(
            parseInt(newMonth.toLocaleDateString().split("/")[0] - 1)
          );
        }
        const leavePolicy = {
          ...formData,
          vacation_allowedMonths: monthsArray,
        };

        console.log(leavePolicy);

        const res = await updateLeavePolicy(leavePolicy);
        console.log(res);
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `Leave policy updated successfully`,
        });
      } catch (error) {
        console.log("error", error);
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: `Failed to update leave policy`,
        });
      }
    },
    [toast]
  );

  const handleLeaveApproval = useCallback(
    async (leaveId, status, message) => {
      try {
        const res = await approveLeave(leaveId, status, message);
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `Leave ${status} successfully`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: `Failed to apply changes leave`,
        });
      }
    },
    [toast]
  );

  const handleAdminMonthlyReport = useCallback(
    async (date) => {
      try {
        const reportStartDate = new Date(date.from).toISOString().split("T")[0];
        const reportEndDate = new Date(date.to).toISOString().split("T")[0];
        const res = await getAdminLeaveReport(
          reportStartDate,
          reportEndDate
        );
        toast({
          className: "bg-black text-white",
          title: "Success",
          description: `You are viewing the latest leave report ${reportStartDate} to ${reportEndDate}`,
        });

        return res;
      } catch (error) {
        return [];
      }
    },
    [toast]
  );
  return (
    <UserContext.Provider
      value={{
        user,
        handleUserSignup,
        handleUserLogin,
        handleSignOut,
        handleApplyLeave,
        handleUserMonthlyReport,
        handleLeaveDelete,
        handleSendReport,

        // Admin
        handleUserApproval,
        handleUserDelete,
        handleUserDisapprove,
        handleUpdatLeavePolicy,
        handleLeaveApproval,
        handleAdminMonthlyReport
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;

export function useUserProvider() {
  const context = useContext(UserContext);
  if (context == undefined) {
    throw new Error("component and page must be inside the provider");
  }
  return context;
}
