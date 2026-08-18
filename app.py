import os,base64
from pathlib import Path
import streamlit as st
from openai import OpenAI
st.set_page_config(page_title="Access AI v0.4",page_icon="🔊")
P=Path(__file__).parent/"system_prompt.txt"
def client():
    try:k=st.secrets["OPENAI_API_KEY"]
    except:k=os.getenv("OPENAI_API_KEY")
    return OpenAI(api_key=k)
def vision(img,mode,q):
    b64=base64.b64encode(img).decode()
    rules={"Read text / mail":"Read all legible text faithfully. Identify document type, sender, date, amount due, due date and required action when visible. Never invent obscured text. Mask sensitive account numbers except the last four digits unless explicitly requested.",
    "Describe scene":"Give a practical nonvisual description. Prioritize people, obstacles, doors, furniture, objects, signs and spatial relationships. Use clock positions when useful. State uncertainty and never claim the scene is safe for navigation.",
    "Find / inspect":"Answer the specific question using nonvisual landmarks, relative position, clock positions, shapes and nearby objects. Never guess safety-critical controls, medication details, traffic conditions or hazards."}[mode]
    prompt=f"{rules}\nUser request: {q or mode}. The user may be unable to visually verify this answer, so accuracy and explicit uncertainty are essential."
    r=client().responses.create(model="gpt-5.6",instructions=P.read_text(),input=[{"role":"user","content":[{"type":"input_text","text":prompt},{"type":"input_image","image_url":f"data:image/jpeg;base64,{b64}","detail":"high"}]}])
    return r.output_text
st.title("🔊 Access AI")
st.write("Accessibility-aware AI with camera assistance for blind and low-vision users.")
tab1,tab2=st.tabs(["📷 Camera + Read","💬 Ask Access AI"])
with tab1:
    mode=st.selectbox("Camera task",["Read text / mail","Describe scene","Find / inspect"])
    st.info({"Read text / mail":"Letters, bills, menus, receipts, labels and signs.","Describe scene":"A practical nonvisual description of what the camera sees.","Find / inspect":"Ask where an object, control or item is located."}[mode])
    photo=st.camera_input("Take a picture")
    q=st.text_input("Optional question",placeholder="Example: How much is due and when?")
    if photo and st.button("Analyze picture",type="primary"):
        try:
            with st.spinner("Analyzing…"):st.session_state["camera_answer"]=vision(photo.getvalue(),mode,q)
        except Exception as e:st.error(str(e))
    if st.session_state.get("camera_answer"):
        st.subheader("Camera result")
        st.write(st.session_state["camera_answer"])
with tab2:
    q2=st.text_area("Ask a question")
    if st.button("Ask Access AI"):
        try:
            r=client().responses.create(model="gpt-5.6",instructions=P.read_text(),input=q2,tools=[{"type":"web_search","search_context_size":"low"}])
            st.session_state["answer"]=r.output_text
        except Exception as e:st.error(str(e))
    if st.session_state.get("answer"):st.write(st.session_state["answer"])
st.warning("Camera assistance is not guaranteed navigation or safety guidance. Verify uncertain medication, hazard, financial, legal, or navigation details.")
