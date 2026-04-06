import * as React from "react";
import {
  Body, Button, Container, Head, Hr, Html, Preview, Section, Text, Heading,
} from "@react-email/components";

interface Props {
  playerFirstName: string;
  approvalUrl: string;
  isReminder?: boolean;
}

export function ParentConsentEmail({ playerFirstName, approvalUrl, isReminder = false }: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {playerFirstName} wants to join CourtMatch — your approval is needed
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎾 Parental Approval Request</Heading>

          {isReminder && (
            <Section style={reminderBanner}>
              <Text style={reminderText}>
                Reminder: {playerFirstName}'s account is still waiting for your approval.
              </Text>
            </Section>
          )}

          <Heading style={h2}>
            {playerFirstName} wants to join CourtMatch
          </Heading>

          <Text style={text}>
            CourtMatch is a safe online platform that helps junior USTA tennis players
            find hitting partners based on UTR ratings. Players can browse profiles,
            send hit requests, and schedule matches — all at public courts. No private
            location sharing is permitted, and all users must agree to community safety
            guidelines before joining.
          </Text>

          <Heading style={sectionTitle}>What data we collect</Heading>
          <Text style={text}>
            We collect your child's name, email address, date of birth, zip code, and
            UTR tennis rating. No payment information is required. All data is stored
            securely and never sold to third parties.
          </Text>

          <Heading style={sectionTitle}>Safety features</Heading>
          <Text style={listText}>
            🔒 <strong>Parent visibility</strong> — you can view all of your child's
            scheduled sessions at any time
          </Text>
          <Text style={listText}>
            📍 <strong>Public courts only</strong> — all matches must be held at public
            tennis venues; sharing home or school addresses is prohibited
          </Text>
          <Text style={listText}>
            📋 <strong>Community guidelines</strong> — every player must agree to safety
            rules before creating an account
          </Text>
          <Text style={listText}>
            🎾 <strong>Rating-based matching</strong> — UTR ratings ensure players are
            matched with appropriate skill-level partners
          </Text>
          <Text style={listText}>
            🚩 <strong>Report system</strong> — any user can be reported and reviewed
            by our team
          </Text>

          <Section style={btnSection}>
            <Button style={btn} href={approvalUrl}>
              Approve {playerFirstName}'s Account
            </Button>
          </Section>

          <Text style={hint}>
            If you did not expect this email or do not wish to approve this account,
            simply ignore it. {playerFirstName}'s account will remain inactive.
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
const h2: React.CSSProperties = { fontSize: "18px", color: "#374151", margin: "0 0 16px" };
const sectionTitle: React.CSSProperties = { fontSize: "15px", color: "#2D7A4F", margin: "20px 0 8px" };
const text: React.CSSProperties = { fontSize: "15px", color: "#374151", margin: "0 0 12px", lineHeight: "1.6" };
const listText: React.CSSProperties = { fontSize: "14px", color: "#374151", margin: "0 0 8px", lineHeight: "1.6", paddingLeft: "4px" };
const btnSection: React.CSSProperties = { margin: "28px 0" };
const btn: React.CSSProperties = { backgroundColor: "#2D7A4F", color: "#ffffff", padding: "14px 32px", borderRadius: "8px", fontWeight: "600", fontSize: "16px", textDecoration: "none" };
const hint: React.CSSProperties = { fontSize: "13px", color: "#9ca3af", margin: "16px 0" };
const hr: React.CSSProperties = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", textAlign: "center" };
const reminderBanner: React.CSSProperties = { backgroundColor: "#fef3c7", borderLeft: "4px solid #f59e0b", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px" };
const reminderText: React.CSSProperties = { fontSize: "14px", color: "#92400e", margin: 0 };
