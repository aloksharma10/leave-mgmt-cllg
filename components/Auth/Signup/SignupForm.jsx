"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { userSignup } from "@/actions/userAction";
import { useToast } from "@/components/ui/use-toast";
import { useRef } from "react";
const SignupForm = () => {
  const { toast } = useToast();
  const formRef = useRef();
  const clientActionSignup = async (formData) => {
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
        formRef.current.reset();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Please enter the valid details!",
      });
    }
  };
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Welcome!</CardTitle>
        <CardDescription className="text-center">
          BCIIT Leave Management App
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={clientActionSignup}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="name"
                placeholder="Enter Full Name"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="company@domain.com"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="******"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="phone"
                placeholder="Enter Your Phone No."
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select name="role">
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="role">
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" type="submit">
              Signup
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
