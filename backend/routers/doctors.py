from fastapi import APIRouter
import ml_service

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.get("")
def list_doctors():
    df = ml_service.get_doctors_df()
    return df.to_dict(orient="records")
