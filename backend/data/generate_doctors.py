"""
Generates vitaguard_doctors.csv — this file was referenced by the original
Streamlit app (doctor_escalation.py) but never included in the upload.
Departments map to the conditions the model can predict.
"""
import csv

doctors = [
    ("Dr. Ananya Rao", "Cardiology", "+91-98450-11223", "ananya.rao@vitaguard-hospital.in"),
    ("Dr. Karan Mehta", "Cardiology", "+91-98450-11224", "karan.mehta@vitaguard-hospital.in"),
    ("Dr. Sneha Iyer", "Pulmonology", "+91-98450-11225", "sneha.iyer@vitaguard-hospital.in"),
    ("Dr. Rohan Verma", "Pulmonology", "+91-98450-11226", "rohan.verma@vitaguard-hospital.in"),
    ("Dr. Priya Nair", "Infectious Disease", "+91-98450-11227", "priya.nair@vitaguard-hospital.in"),
    ("Dr. Arjun Malhotra", "Infectious Disease", "+91-98450-11228", "arjun.malhotra@vitaguard-hospital.in"),
    ("Dr. Kavita Desai", "Critical Care / ICU", "+91-98450-11229", "kavita.desai@vitaguard-hospital.in"),
    ("Dr. Vikram Chauhan", "Critical Care / ICU", "+91-98450-11230", "vikram.chauhan@vitaguard-hospital.in"),
    ("Dr. Meera Pillai", "General Medicine", "+91-98450-11231", "meera.pillai@vitaguard-hospital.in"),
    ("Dr. Sanjay Kulkarni", "General Medicine", "+91-98450-11232", "sanjay.kulkarni@vitaguard-hospital.in"),
    ("Dr. Neha Bhatt", "Emergency Medicine", "+91-98450-11233", "neha.bhatt@vitaguard-hospital.in"),
    ("Dr. Aditya Joshi", "Emergency Medicine", "+91-98450-11234", "aditya.joshi@vitaguard-hospital.in"),
]

with open("vitaguard_doctors.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["doctor_name", "department", "contact_number", "email"])
    writer.writerows(doctors)

print(f"Wrote {len(doctors)} doctors to vitaguard_doctors.csv")
