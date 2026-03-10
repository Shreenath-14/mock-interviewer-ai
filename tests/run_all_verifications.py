
import subprocess
import sys

scripts = [
    "tests/verify_resume.py",
    "tests/verify_test_flow.py",
    "tests/verify_normal_grade.py",
    "tests/verify_beta_history.py"
]

results = {}

print("🚀 Starting User Audit Verification Suite...")
for script in scripts:
    print(f"\nExample Running: {script} ...")
    try:
        # Run script and capture output
        res = subprocess.run([sys.executable, script], capture_output=True, text=True, timeout=30)
        if res.returncode == 0:
            print(f"✅ PASS: {script}")
            results[script] = "PASS"
            # Optional: print summary lines
            # print(res.stdout[:200] + "...") 
        else:
            print(f"❌ FAIL: {script}")
            print(res.stdout)
            print(res.stderr)
            results[script] = "FAIL"
    except Exception as e:
        print(f"❌ ERROR: {script} - {e}")
        results[script] = "ERROR"

print("\n\n📊 FINAL AUDIT REPORT")
print("---------------------")
all_passed = True
for script, status in results.items():
    print(f"{script: <30} : {status}")
    if status != "PASS":
        all_passed = False

if all_passed:
    print("\n✅ All features verified successfully.")
else:
    print("\n⚠️ Some features failed verification.")
