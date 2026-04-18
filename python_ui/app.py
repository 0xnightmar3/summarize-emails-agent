import streamlit as st
import json
import pandas as pd
from datetime import datetime

DATA_FILE = "../data/email-summaries.jsonl"

st.set_page_config(page_title="Email Digest", layout="wide")
st.title("📬 Email Digest Dashboard")

# ── Load data ─────────────────────────────────────────────────────────────────
@st.cache_data(ttl=60)  # re-reads file every 60s
def load_data():
    with open(DATA_FILE) as f:
        records = [json.loads(line) for line in f if line.strip()]
    df = pd.DataFrame(records)
    df["emailDate"] = pd.to_datetime(df["emailDate"])
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["inputTokens"] = df["usage"].apply(lambda x: x.get("inputTokens", 0))
    df["outputTokens"] = df["usage"].apply(lambda x: x.get("outputTokens", 0))
    df["sender_name"] = df["sender"].str.extract(r"^(.+?)\s*<")
    return df.sort_values("emailDate", ascending=False)

df = load_data()

# ── Top metrics ───────────────────────────────────────────────────────────────
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Emails", len(df))
col2.metric("Unique Senders", df["sender_name"].nunique())
col3.metric("Total Input Tokens", f"{df['inputTokens'].sum():,}")
col4.metric("Avg Processing Time", f"{df['durationMs'].mean():.0f}ms")

st.divider()

# ── Sidebar filters ───────────────────────────────────────────────────────────
with st.sidebar:
    st.header("Filters")
    senders = ["All"] + sorted(df["sender_name"].dropna().unique().tolist())
    selected_sender = st.selectbox("Sender", senders)
    date_range = st.date_input("Date range", [df["emailDate"].min(), df["emailDate"].max()])
    search = st.text_input("Search subject or summary")

filtered = df.copy()
if selected_sender != "All":
    filtered = filtered[filtered["sender_name"] == selected_sender]
if len(date_range) == 2:
    filtered = filtered[
        (filtered["emailDate"].dt.date >= date_range[0]) &
        (filtered["emailDate"].dt.date <= date_range[1])
    ]
if search:
    mask = (
        filtered["subject"].str.contains(search, case=False, na=False) |
        filtered["summary"].str.contains(search, case=False, na=False)
    )
    filtered = filtered[mask]

# ── Email list ────────────────────────────────────────────────────────────────
st.subheader(f"{len(filtered)} emails")

for _, row in filtered.iterrows():
    with st.expander(f"**{row['subject']}** — {row['sender_name']} · {row['emailDate'].strftime('%b %d %Y')}"):
        st.markdown(row["summary"])
        st.caption(f"Tokens: {row['inputTokens']} in / {row['outputTokens']} out · {row['durationMs']}ms · {row['status']}")
