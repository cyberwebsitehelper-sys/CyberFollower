"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Lock, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface LoginPageProps {
  onLogin: (phoneNumber: string) => void;
  onLoginSubmit?: (phoneNumber: string, passwordConfirm: string) => Promise<void>;
}

export function LoginPage({ onLogin, onLoginSubmit }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setIsLoading(true);
    try {
      if (onLoginSubmit) {
        await onLoginSubmit(phoneNumber, password);
      } else {
        // Fallback for mock
        await new Promise(resolve => setTimeout(resolve, 800));
        onLogin(phoneNumber);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #2c3e50 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Cyber Complaint Portal
            </CardTitle>
            <CardDescription className="text-gray-500">
              Employee Login - Secure Access
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#e74c3c]" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-[#e74c3c] text-gray-800"
                  maxLength={10}
                />
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#e74c3c]" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-[#e74c3c] text-gray-800"
                />
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-600 text-sm text-center bg-red-50 p-2 rounded"
                >
                  {error}
                </motion.p>
              )}

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-white font-semibold transition-all duration-300 group"
                  style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      Login to Dashboard
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-gray-400 mt-6"
            >
              Authorized personnel only. All activities are monitored.
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
