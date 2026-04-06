import * as React from "react";
import {
  Body, Button, Container, Head, Hr, Html, Preview, Section, Text, Heading,
} from "@react-email/components";

interface Props {
  firstName: string;
  verificationUrl: string;
}

export function VerificationEmail({ firstName, verificationUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Verify your CourtMatch email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎾 Verify your email</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            Welcome to CourtMatch! Click the button below to verify your email address
            and activate your account.
          </Text>
          <Section style={btnSection}>
            <Button style={btn} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={hint}>
            This link expires in 24 hours. If you didn't create a CourtMatch account,
            you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>CourtMatch · Find your next hitting partner</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = { backgroundColor: "#f9fafb", fontFamily: "sans-serif" };
const container: React.CSSProperties = { maxWidth: "560px", margin: "0 auto", padding: "32px 24px", backgroundColor: "#ffffff", borderRadius: "16px" };
const h1: React.CSSProperties = { fontSize: "22px", color: "#2D7A4F", margin: "0 0 16px" };
const text: React.CSSProperties = { fontSize: "15px", color: "#374151", margin: "0 0 16px", lineHeight: "1.6" };
const btnSection: React.CSSProperties = { margin: "24px 0" };
const btn: React.CSSProperties = { backgroundColor: "#2D7A4F", color: "#ffffff", padding: "12px 28px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", textDecoration: "none" };
const hint: React.CSSProperties = { fontSize: "13px", color: "#9ca3af", margin: "16px 0" };
const hr: React.CSSProperties = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", textAlign: "center" };
