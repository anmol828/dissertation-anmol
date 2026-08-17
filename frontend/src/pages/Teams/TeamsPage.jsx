import React, { useEffect, useState } from "react";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { PLAYER_POSITIONS, SKILL_LEVELS } from "../../lib/constants.js";
import { getApiErrorMessage, hasNonEmptyValue } from "../../lib/form-utils.js";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [name, setName] = useState("");
  const [postForm, setPostForm] = useState({
    teamId: "",
    title: "",
    description: "",
    neededPosition: "",
    skillLevel: "",
    visibility: true
  });
  const [inviteForm, setInviteForm] = useState({
    teamId: "",
    playerProfileId: "",
    message: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const [allRes, myRes, playersRes, postsRes, outgoingRes] = await Promise.all([
        api.get("/teams"),
        api.get("/teams/me"),
        api.get("/players"),
        api.get("/recruitment/posts"),
        api.get("/recruitment/outgoing").catch(() => ({ data: { requests: [] } }))
      ]);

      const nextMyTeams = myRes.data.teams || [];
      setTeams(allRes.data.teams || []);
      setMyTeams(nextMyTeams);
      setPlayers(playersRes.data.players || []);
      setPosts(postsRes.data.posts || []);
      setRequests(outgoingRes.data.requests || []);
      setPostForm((prev) => ({
        ...prev,
        teamId: prev.teamId || String(nextMyTeams[0]?.id || "")
      }));
      setInviteForm((prev) => ({
        ...prev,
        teamId: prev.teamId || String(nextMyTeams[0]?.id || "")
      }));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load teams"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!hasNonEmptyValue(name)) {
      setError("Team name is required.");
      return;
    }

    try {
      await api.post("/teams", { name: name.trim() });
      setName("");
      setSuccess("Team created successfully.");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create team"));
    }
  };

  const handlePostCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!postForm.teamId || !hasNonEmptyValue(postForm.title)) {
      setError("Choose a team and add a post title.");
      return;
    }

    try {
      await api.post("/recruitment/posts", {
        ...postForm,
        teamId: Number(postForm.teamId),
        title: postForm.title.trim(),
        description: postForm.description.trim(),
        neededPosition: postForm.neededPosition || null,
        skillLevel: postForm.skillLevel || null
      });
      setPostForm((prev) => ({ ...prev, title: "", description: "" }));
      setSuccess("Recruitment post published.");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create recruitment post"));
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!inviteForm.teamId || !inviteForm.playerProfileId) {
      setError("Choose a team and player to invite.");
      return;
    }

    try {
      await api.post("/recruitment", {
        teamId: Number(inviteForm.teamId),
        playerProfileId: Number(inviteForm.playerProfileId),
        message: inviteForm.message.trim()
      });
      setInviteForm((prev) => ({ ...prev, playerProfileId: "", message: "" }));
      setSuccess("Invitation sent.");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send invitation"));
    }
  };

  const handleApply = async (postId) => {
    setError("");
    setSuccess("");

    try {
      await api.post(`/recruitment/posts/${postId}/apply`, {});
      setSuccess("Join request sent.");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to request joining this team"));
    }
  };

  const handleDecision = async (requestId, status) => {
    setError("");
    setSuccess("");

    try {
      await api.post(`/recruitment/${requestId}/decision`, { status });
      setSuccess(`Request ${status === "ACCEPTED" ? "approved" : "rejected"}.`);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update request"));
    }
  };

  if (loading) return <p>Loading teams...</p>;

  const applicationRequests = requests.filter((request) => request.postId);
  const invitationRequests = requests.filter((request) => !request.postId);

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-surface p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Teams</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Create a team, publish recruitment needs, invite players, and approve join requests
          from one compact workspace.
        </p>
      </section>

      <Notice tone="success">{success}</Notice>
      <Notice tone="error">{error}</Notice>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">My Teams</h2>
          <form onSubmit={handleCreate} className="mt-5 flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New team name"
              className="flex-1 border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            <button
              type="submit"
              className="rounded-2xl bg-charcoal px-5 py-3 text-sm font-medium text-white hover:bg-charcoal"
            >
              Create
            </button>
          </form>
          <div className="mt-5 space-y-3">
            {myTeams.map((team) => (
              <div key={team.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <p className="text-lg font-semibold text-foreground">{team.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {team.venue?.name || "Community team"}
                </p>
                <p className="mt-2 text-sm text-muted">Members: {team.members?.length || 0}</p>
              </div>
            ))}
            {myTeams.length === 0 && (
              <p className="text-sm text-muted">You do not own any teams yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Recruit Players</h2>
          <form onSubmit={handlePostCreate} className="mt-5 space-y-3">
            <select
              value={postForm.teamId}
              onChange={(e) => setPostForm((prev) => ({ ...prev, teamId: e.target.value }))}
              className="w-full border border-line rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Choose team</option>
              {myTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={postForm.title}
              onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Post title"
              className="w-full border border-line rounded-xl px-3 py-2.5 text-sm"
            />
            <textarea
              value={postForm.description}
              onChange={(e) => setPostForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What kind of player do you need?"
              rows="3"
              className="w-full border border-line rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={postForm.neededPosition}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, neededPosition: e.target.value }))
                }
                className="border border-line rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">Any position</option>
                {PLAYER_POSITIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={postForm.skillLevel}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, skillLevel: e.target.value }))
                }
                className="border border-line rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">Any skill</option>
                {SKILL_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={postForm.visibility}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, visibility: e.target.checked }))
                }
              />
              Visible to players
            </label>
            <button
              type="submit"
              disabled={myTeams.length === 0}
              className="w-full rounded-2xl bg-charcoal px-5 py-3 text-sm font-medium text-white hover:bg-charcoal disabled:opacity-50"
            >
              Publish Post
            </button>
          </form>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Invite Player</h2>
          <form onSubmit={handleInvite} className="mt-5 space-y-3">
            <select
              value={inviteForm.teamId}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, teamId: e.target.value }))}
              className="w-full border border-line rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Choose team</option>
              {myTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <select
              value={inviteForm.playerProfileId}
              onChange={(e) =>
                setInviteForm((prev) => ({ ...prev, playerProfileId: e.target.value }))
              }
              className="w-full border border-line rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Choose player</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.user?.name} - {player.position?.replaceAll("_", " ")} - {player.skill}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={inviteForm.message}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Optional message"
              className="w-full border border-line rounded-xl px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={myTeams.length === 0}
              className="w-full rounded-2xl bg-charcoal px-5 py-3 text-sm font-medium text-white hover:bg-charcoal disabled:opacity-50"
            >
              Send Invitation
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Join Requests</h2>
          <div className="mt-5 space-y-3">
            {applicationRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <p className="font-semibold text-foreground">
                  {request.playerProfile?.user?.name} wants to join {request.team?.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {request.post?.title || "Recruitment post"} - {request.status}
                </p>
                {request.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleDecision(request.id, "ACCEPTED")}
                      className="rounded-xl bg-pitch px-3 py-2 text-sm font-medium text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecision(request.id, "REJECTED")}
                      className="rounded-xl bg-surface-2 px-3 py-2 text-sm font-medium text-foreground"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {applicationRequests.length === 0 && (
              <p className="text-sm text-muted">No join requests yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Open Recruitment</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-line bg-surface-2 p-4">
              <p className="font-semibold text-foreground">{post.title}</p>
              <p className="mt-1 text-sm text-muted">
                {post.team?.name} - {post.team?.venue?.name || "Community team"}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                {post.description || "This team is accepting player requests."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                  {post.neededPosition?.replaceAll("_", " ") || "Any position"}
                </span>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                  {post.skillLevel || "Any skill"}
                </span>
              </div>
              <button
                onClick={() => handleApply(post.id)}
                className="mt-4 w-full rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal"
              >
                Request to Join
              </button>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-muted">No open recruitment posts yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">All Teams</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <div key={team.id} className="rounded-2xl border border-line bg-surface-2 p-4">
              <p className="text-lg font-semibold text-foreground">{team.name}</p>
              <p className="mt-1 text-sm text-muted">Owner: {team.owner?.name || "Unknown"}</p>
              <p className="mt-2 text-sm text-muted">Members: {team.members?.length || 0}</p>
            </div>
          ))}
          {teams.length === 0 && <p className="text-sm text-muted">No teams available yet.</p>}
        </div>
      </section>

      {invitationRequests.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sent Invitations</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {invitationRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <p className="font-semibold text-foreground">
                  {request.playerProfile?.user?.name} - {request.team?.name}
                </p>
                <p className="mt-1 text-sm text-muted">Status: {request.status}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamsPage;
