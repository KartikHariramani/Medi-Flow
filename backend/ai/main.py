from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from typing import Literal, List, Dict, Optional

app = FastAPI(title="MediFlow AI Queue & Clinical Predictor")

# ==========================================
# 1. WAIT TIME PREDICTION MODELS & ROUTE
# ==========================================
class PredictRequest(BaseModel):
    token_number: int
    current_queue_position: int
    avg_consultation_time: int
    patients_ahead: int
    emergency_count_in_queue: int

class PredictResponse(BaseModel):
    estimated_wait_minutes: int
    confidence_level: Literal["low", "medium", "high"]
    updated_at: datetime

@app.post("/ai/predict-wait-time", response_model=PredictResponse)
def predict_wait_time(request: PredictRequest):
    # Base calculation
    base_wait = request.patients_ahead * request.avg_consultation_time
    
    # Priority penalty (5 mins per emergency)
    emergency_penalty = request.emergency_count_in_queue * 5
    
    predicted_wait = base_wait + emergency_penalty
    
    # Simple smoothing confidence evaluation
    confidence = "high"
    if request.emergency_count_in_queue > 3:
        confidence = "low"
    elif request.emergency_count_in_queue > 0:
        confidence = "medium"

    return PredictResponse(
        estimated_wait_minutes=predicted_wait,
        confidence_level=confidence,
        updated_at=datetime.now()
    )

# ==========================================
# 2. QUEUE OPTIMIZATION MODELS & ROUTE
# ==========================================
class QueueItem(BaseModel):
    appointment_id: str
    patient_id: str
    patient_name: str
    token_number: int
    priority: str  # 'normal' or 'emergency'
    position: int
    travel_duration_minutes: float
    is_delayed: bool
    is_arrived: bool

class OptimizeQueueRequest(BaseModel):
    doctor_id: str
    current_queue: List[QueueItem]

class OptimizeQueueResponse(BaseModel):
    optimized_queue: List[QueueItem]
    updated_positions: Dict[str, int]  # appointment_id -> new_position
    optimizations_applied: List[str]

@app.post("/ai/optimize-queue", response_model=OptimizeQueueResponse)
def optimize_queue(request: OptimizeQueueRequest):
    queue = request.current_queue
    if not queue:
        return OptimizeQueueResponse(optimized_queue=[], updated_positions={}, optimizations_applied=[])
    
    optimizations = []
    
    # 1. Split by priority
    emergencies = [item for item in queue if item.priority == 'emergency']
    normals = [item for item in queue if item.priority != 'emergency']
    
    # Keep emergencies at the top, sorted by their original queue positions
    emergencies.sort(key=lambda x: x.position)
    if len(emergencies) > 0:
        optimizations.append(f"Fast-tracked {len(emergencies)} emergency patient(s) to the head of the queue.")
    
    # 2. Handle normals
    # Splitting normals into: On-time (or arrived) vs. Delayed
    on_time_normals = [item for item in normals if not item.is_delayed]
    delayed_normals = [item for item in normals if item.is_delayed]
    
    # Sort on-time patients by original position
    on_time_normals.sort(key=lambda x: x.position)
    
    # Sort delayed patients by travel time (so those arriving soonest are scheduled earlier)
    delayed_normals.sort(key=lambda x: (x.travel_duration_minutes, x.position))
    
    # Check if a swap occurred (delayed patient was pushed back)
    # If the first original normal patient was delayed and swapped with an on-time patient
    original_normals_sorted = sorted(normals, key=lambda x: x.position)
    
    if original_normals_sorted and original_normals_sorted[0].is_delayed and len(on_time_normals) > 0:
        swapped_with = on_time_normals[0].patient_name
        delayed_pat = original_normals_sorted[0].patient_name
        optimizations.append(f"Patient {delayed_pat} is delayed; swapped priority with {swapped_with} to keep the room active.")
    elif len(delayed_normals) > 0:
        optimizations.append(f"Reprioritized {len(delayed_normals)} delayed patient(s) based on arrival time estimates.")
        
    # Reassemble queue
    optimized_queue = emergencies + on_time_normals + delayed_normals
    
    # Reindex positions
    updated_positions = {}
    for idx, item in enumerate(optimized_queue):
        item.position = idx + 1
        updated_positions[item.appointment_id] = item.position
        
    return OptimizeQueueResponse(
        optimized_queue=optimized_queue,
        updated_positions=updated_positions,
        optimizations_applied=optimizations
    )

# ==========================================
# 3. CLINICAL PATIENT SUMMARY MODELS & ROUTE
# ==========================================
class PatientData(BaseModel):
    patient_id: str
    name: str
    dob: Optional[str] = None
    blood_group: Optional[str] = None
    has_diabetes: bool = False
    has_cancer: bool = False
    other_conditions: List[str] = []
    questionnaire_answers: List[Dict[str, str]] = []  # list of {question: str, answer: str}
    medical_history: List[Dict[str, Optional[str]]] = []  # list of {condition: str, diagnosis: str, prescription: str, visited_at: str}

class SummarizeResponse(BaseModel):
    patient_id: str
    ai_summary: str
    risk_level: Literal["low", "medium", "high", "critical"]
    allergies: List[str]
    chronic_conditions: List[str]
    clinical_alerts: List[str]

@app.post("/ai/summarize-patient", response_model=SummarizeResponse)
def summarize_patient(request: PatientData):
    # Extract chronic conditions
    chronic = []
    if request.has_diabetes:
        chronic.append("Diabetes Mellitus")
    if request.has_cancer:
        chronic.append("Malignancy/Cancer history")
        
    # Extract allergies
    allergies = []
    alerts = []
    
    # Scan questionnaire answers for allergies and chronic issues
    symptoms = ""
    for qa in request.questionnaire_answers:
        q = qa.get("question", "").lower()
        a = qa.get("answer", "")
        if "allergy" in q or "allergies" in q:
            if a and a.lower() != "no" and "none" not in a.lower():
                allergies.append(a.replace("Yes: ", ""))
                alerts.append(f"ALLERGY ALERT: Patient reported allergy: {a.replace('Yes: ', '')}")
        if "hypertension" in q and a and a.lower().startswith("yes"):
            chronic.append("Hypertension")
        if "symptoms" in q:
            symptoms = a

    # Scan medical history for condition and prescription notes
    for hist in request.medical_history:
        cond = hist.get("condition")
        diag = hist.get("diagnosis")
        if cond and cond not in chronic:
            # Simple heuristic: if diabetes/hypertension/asthma mentioned
            for c_term in ["diabetes", "hypertension", "asthma", "bp", "thyroid", "heart"]:
                if c_term in cond.lower() and cond not in chronic:
                    chronic.append(cond)
        if diag:
            for c_term in ["penicillin", "sulfa", "aspirin"]:
                if c_term in diag.lower() and f"Allergic to {c_term.capitalize()}" not in allergies:
                    allergies.append(f"Allergic to {c_term.capitalize()}")
                    alerts.append(f"DIAGNOSIS ALERT: Allergy to {c_term.capitalize()} found in medical history")

    # Evaluate Risk Level
    risk = "low"
    if request.has_cancer:
        risk = "critical"
        alerts.append("CRITICAL: Cancer history under surveillance.")
    elif request.has_diabetes or "Hypertension" in chronic:
        risk = "high"
    elif len(allergies) > 0 or len(chronic) > 0:
        risk = "medium"

    # Build Structured Clinical Summary
    age_str = ""
    if request.dob:
        try:
            dob_year = int(request.dob.split("-")[0])
            curr_year = datetime.now().year
            age_str = f" ({curr_year - dob_year} y.o.)"
        except:
            pass

    summary_parts = [
        f"Patient {request.name}{age_str} with blood group {request.blood_group or 'Unknown'}."
    ]
    
    if symptoms:
        summary_parts.append(f"Active presenting symptoms: '{symptoms}'.")
    else:
        summary_parts.append("No active symptoms reported for this visit.")

    if chronic:
        summary_parts.append(f"Chronic conditions: {', '.join(chronic)}.")
    if allergies:
        summary_parts.append(f"Allergies: {', '.join(allergies)}.")
        
    if request.medical_history:
        summary_parts.append(f"Attended {len(request.medical_history)} past consultation(s) at MediFlow.")
        last_visit = request.medical_history[0]
        if last_visit.get("diagnosis"):
            summary_parts.append(f"Last diagnosed with: {last_visit.get('diagnosis')}.")
            
    summary_text = " ".join(summary_parts)

    return SummarizeResponse(
        patient_id=request.patient_id,
        ai_summary=summary_text,
        risk_level=risk,
        allergies=allergies,
        chronic_conditions=chronic,
        clinical_alerts=alerts
    )

# ==========================================
# 4. AI TRIAGE ENGINE
# ==========================================
class TriageRequest(BaseModel):
    symptoms: str
    medical_history: List[str] = []
    chronic_conditions: List[str] = []

class TriageResponse(BaseModel):
    severity_score: int  # 0 to 100
    risk_level: Literal["low", "medium", "high", "critical"]
    recommended_action: str

@app.post("/ai/triage", response_model=TriageResponse)
def triage_patient(request: TriageRequest):
    score = 10  # base score
    symptoms_lower = request.symptoms.lower()
    
    # Check for critical keywords
    critical_keywords = ["chest pain", "difficulty breathing", "severe bleeding", "unconscious", "stroke", "paralysis", "heart attack"]
    high_keywords = ["high fever", "severe pain", "fracture", "abdominal pain", "blurry vision", "dizziness"]
    medium_keywords = ["moderate pain", "cough", "vomiting", "mild fever", "migraine", "infection"]
    
    for kw in critical_keywords:
        if kw in symptoms_lower:
            score += 50
    for kw in high_keywords:
        if kw in symptoms_lower:
            score += 30
    for kw in medium_keywords:
        if kw in symptoms_lower:
            score += 15
            
    # Add weight for existing conditions
    score += len(request.chronic_conditions) * 8
    score += len(request.medical_history) * 4
    
    # Cap score
    score = min(score, 100)
    
    if score >= 80:
        level = "critical"
        action = "Immediate priority queue assignment and alert attending head physician."
    elif score >= 60:
        level = "high"
        action = "Fast-track queue placement and notify triage nurse for physical vitals check."
    elif score >= 35:
        level = "medium"
        action = "Standard queue scheduling with 15-minute wait time check."
    else:
        level = "low"
        action = "Regular queue scheduling. Recommend outpatient clinic or self-care instructions."

    return TriageResponse(
        severity_score=score,
        risk_level=level,
        recommended_action=action
    )

# ==========================================
# 5. AI NO-SHOW PREDICTION ENGINE
# ==========================================
class NoShowRequest(BaseModel):
    age: int
    chronic_conditions_count: int
    lead_time_days: int
    previous_no_shows: int
    appointment_hour: int

class NoShowResponse(BaseModel):
    no_show_probability: float
    risk_level: Literal["low", "medium", "high"]
    recommended_actions: List[str]

@app.post("/ai/predict-noshow", response_model=NoShowResponse)
def predict_no_show(request: NoShowRequest):
    # Simulated predictive scoring logic
    prob = 0.05  # Base probability
    
    # High lead times increase no show probability
    prob += min(request.lead_time_days * 0.02, 0.40)
    
    # Previous history is a major feature
    prob += min(request.previous_no_shows * 0.15, 0.45)
    
    # Very early or late appointments have slightly higher no-show rates
    if request.appointment_hour < 9 or request.appointment_hour > 16:
        prob += 0.10
        
    # Chronic conditions usually mean higher compliance (lower no-show)
    prob -= min(request.chronic_conditions_count * 0.03, 0.10)
    
    # Age factor: very young adults have higher no-shows, older people lower
    if request.age < 30:
        prob += 0.08
    elif request.age > 60:
        prob -= 0.05
        
    # Bound probability
    prob = max(0.01, min(prob, 0.99))
    
    # Determine risk level
    if prob > 0.50:
        risk = "high"
        actions = [
            "Send an automated Telegram reminder confirmation prompt.",
            "Call patient 24 hours in advance to confirm slot.",
            "Enable overbooking for this slot to mitigate idle doctor time."
        ]
    elif prob > 0.20:
        risk = "medium"
        actions = [
            "Send standard Telegram reminder alert 12 hours prior.",
            "Confirm availability via double-opt-in interactive Telegram message."
        ]
    else:
        risk = "low"
        actions = [
            "Send routine automated Telegram notification reminder."
        ]
        
    return NoShowResponse(
        no_show_probability=round(prob, 2),
        risk_level=risk,
        recommended_actions=actions
    )

# ==========================================
# 6. RESOURCE OPTIMIZATION ENGINE
# ==========================================
class DepartmentLoad(BaseModel):
    department_name: str
    active_doctors: int
    queue_length: int
    avg_wait_minutes: int
    emergency_count: int

class ResourceOptimizationRequest(BaseModel):
    departments: List[DepartmentLoad]

class ReassignmentRecommendation(BaseModel):
    action: str
    from_department: str
    to_department: str
    reason: str

class ResourceOptimizationResponse(BaseModel):
    recommendations: List[ReassignmentRecommendation]
    capacity_tips: List[str]

@app.post("/ai/optimize-resources", response_model=ResourceOptimizationResponse)
def optimize_resources(request: ResourceOptimizationRequest):
    recommendations = []
    capacity_tips = []
    
    # Sort departments by wait time & load
    underloaded = []
    overloaded = []
    
    for dept in request.departments:
        # Simple heuristic: ratio of queue length to doctors
        ratio = dept.queue_length / max(dept.active_doctors, 1)
        if ratio > 5 or dept.avg_wait_minutes > 45 or dept.emergency_count > 2:
            overloaded.append(dept)
        elif ratio < 2 and dept.active_doctors > 1:
            underloaded.append(dept)
            
    # Try to balance
    for ov in overloaded:
        if underloaded:
            und = underloaded.pop(0)
            recommendations.append(ReassignmentRecommendation(
                action="REASSIGN_DOCTOR",
                from_department=und.department_name,
                to_department=ov.department_name,
                reason=f"High patient ratio ({round(ov.queue_length/ov.active_doctors, 1)}/doc) and wait times ({ov.avg_wait_minutes}m) in {ov.department_name} contrasted with light load in {und.department_name}."
            ))
            
    # General capacity improvements
    for dept in request.departments:
        if dept.avg_wait_minutes > 60:
            capacity_tips.append(f"Consider opening a surge shift or tele-health slots for {dept.department_name} to address severe delays.")
        if dept.emergency_count > 3:
            capacity_tips.append(f"Redirect non-emergency triaged patients from {dept.department_name} to general primary care clinics.")
            
    if not recommendations:
        capacity_tips.append("All hospital department resources are currently distributed optimally relative to active patient loads.")
        
    return ResourceOptimizationResponse(
        recommendations=recommendations,
        capacity_tips=capacity_tips
    )

# ==========================================
# 7. HEALTH CHECK ROUTE
# ==========================================
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MediFlow AI Clinical & Queue Service"}


