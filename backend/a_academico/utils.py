from decimal import Decimal, ROUND_HALF_UP

def arredondar_nota(value, decimal_places=1):
    if value is None:
        return 0.0
    decimal_val = Decimal(str(value))
    quantum = Decimal('10') ** -decimal_places
    return float(decimal_val.quantize(quantum, rounding=ROUND_HALF_UP))
