import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Mail, FileText, Clock, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InvestorRequest {
  id: string;
  email: string;
  full_name: string;
  company: string | null;
  phone: string | null;
  investment_range: string;
  message: string | null;
  status: string;
  documents_signed_at: string | null;
  password_generated_at: string | null;
  invitation_sent_at: string | null;
  created_at: string;
  signature_count?: number;
}

export default function InvestorApprovalPanel() {
  const [requests, setRequests] = useState<InvestorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('investor_interest_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      const requestsWithCounts = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { count } = await supabase
            .from('investor_document_signatures')
            .select('*', { count: 'exact', head: true })
            .eq('investor_request_id', request.id);

          return { ...request, signature_count: count || 0 };
        })
      );

      setRequests(requestsWithCounts);
    } catch (err: any) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(request: InvestorRequest) {
    if (!request.documents_signed_at) {
      alert('Cannot approve: Investor has not completed document signatures.');
      return;
    }

    if (!confirm(`Approve investor request for ${request.full_name}? This will create an investor account and send login credentials.`)) {
      return;
    }

    setProcessing(request.id);

    try {
      const tempPassword = generatePassword();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: request.email,
        password: tempPassword,
        options: {
          data: {
            full_name: request.full_name,
            user_type: 'investor',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_investor_approved: true,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      const { error: updateError } = await supabase
        .from('investor_interest_requests')
        .update({
          status: 'approved',
          password_generated_at: new Date().toISOString(),
          invitation_sent_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      await supabase.functions.invoke('send-email', {
        body: {
          to: request.email,
          subject: 'Welcome to GigMate Investor Portal',
          text: `Dear ${request.full_name},\n\nYour investor access has been approved!\n\nLogin Credentials:\nEmail: ${request.email}\nTemporary Password: ${tempPassword}\n\nPlease log in at the investor portal and change your password immediately.\n\nBest regards,\nThe GigMate Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ff6b35;">Welcome to GigMate Investor Portal</h2>
              <p>Dear ${request.full_name},</p>
              <p>Your investor access has been approved!</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Login Credentials</h3>
                <p><strong>Email:</strong> ${request.email}</p>
                <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              </div>
              <p><strong>Important:</strong> Please log in at the investor portal and change your password immediately.</p>
              <p>Best regards,<br/>The GigMate Team</p>
            </div>
          `,
        },
      });

      alert(`Investor approved! Login credentials sent to ${request.email}`);
      loadRequests();
    } catch (err: any) {
      console.error('Error approving investor:', err);
      alert(`Failed to approve investor: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(request: InvestorRequest) {
    if (!confirm(`Reject investor request for ${request.full_name}?`)) {
      return;
    }

    setProcessing(request.id);

    try {
      const { error } = await supabase
        .from('investor_interest_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (error) throw error;

      await supabase.functions.invoke('send-email', {
        body: {
          to: request.email,
          subject: 'GigMate Investor Application Update',
          text: `Dear ${request.full_name},\n\nThank you for your interest in investing in GigMate. After careful review, we are unable to approve your investor access request at this time.\n\nWe appreciate your interest and wish you the best.\n\nBest regards,\nThe GigMate Team`,
        },
      });

      alert('Investor request rejected.');
      loadRequests();
    } catch (err: any) {
      console.error('Error rejecting investor:', err);
      alert(`Failed to reject investor: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  }

  function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading investor requests...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Investor Approval Panel</h2>
        <p className="text-gray-600">Review and approve investor access requests</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{request.full_name}</div>
                      <div className="text-sm text-gray-500">{request.email}</div>
                      {request.company && (
                        <div className="text-sm text-gray-500">{request.company}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {request.investment_range}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {request.signature_count || 0} / 3 signed
                      </span>
                      {request.documents_signed_at && (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                  <td className="px-6 py-4">
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={processing === request.id || !request.documents_signed_at}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          disabled={processing === request.id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                    {request.status === 'approved' && request.invitation_sent_at && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        Invited {new Date(request.invitation_sent_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No investor requests found.
          </div>
        )}
      </div>
    </div>
  );
}
