import math
L, t = 2.5, 1.5
di = math.radians(30.0)   # inner angle from the screenshot

# --- what the code does ---
cot_o = 1/math.tan(di) + t/L
do_code = math.degrees(math.atan(1/cot_o))
R_code  = L/math.tan(di)          # placed from REAR AXLE CENTER

# --- correct Ackermann ---
# tan(di) = L/(R - t/2)  ->  R = L/tan(di) + t/2   (R = ICR to rear axle CENTER)
R_true  = L/math.tan(di) + t/2
do_true = math.degrees(math.atan(L/(R_true + t/2)))

print(f"inner            = 30.000 deg")
print(f"outer (code)     = {do_code:.3f} deg   <- matches screenshot 23.2")
print(f"outer (correct)  = {do_true:.3f} deg")
print()
print(f"R from rear-axle-center (code)    = {R_code:.4f} m")
print(f"R from rear-axle-center (correct) = {R_true:.4f} m")
print(f"ICR placement error               = {R_true-R_code:.4f} m  (= t/2 = {t/2})")
print()
# Does the code's ICR actually lie on the inner wheel axis?
# inner wheel is at x=-t/2 (left), front axle y=-L/2 in car frame; ICR at (-R_code, +L/2)... check angle
# Perpendicular distance test: for the ICR to be correct, angle subtended at inner wheel must equal di
for name,R in (("code",R_code),("correct",R_true)):
    # ICR sits at lateral distance R from rear axle center, on the rear axle line
    dx_in  = R - t/2      # lateral distance from inner front wheel to ICR
    ang_in = math.degrees(math.atan(L/dx_in))
    dx_out = R + t/2
    ang_out= math.degrees(math.atan(L/dx_out))
    print(f"{name:8s}: implied inner={ang_in:7.3f}  outer={ang_out:7.3f}")
