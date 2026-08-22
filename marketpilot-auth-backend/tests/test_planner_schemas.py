from datetime import date
from uuid import uuid4

from app.schemas import (
    BatchGenerateContentRequest,
    BatchGenerateContentResponse,
    CampaignChannel,
    CarouselSlideItem,
    ContentFormat,
    ContentStatus,
    EditorialCalendarResponse,
    PlannerContentItemCreateRequest,
    PlannerContentItemResponse,
    ScriptSceneItem,
    StructuredContentPayload,
)


def test_planner_enums():
    assert ContentStatus.scheduled == "scheduled"
    assert ContentStatus.published == "published"
    assert ContentFormat.post_caption == "post_caption"
    assert ContentFormat.carousel_slides == "carousel_slides"
    assert ContentFormat.short_video_script == "short_video_script"
    assert ContentFormat.email_newsletter == "email_newsletter"
    assert ContentFormat.direct_message == "direct_message"


def test_carousel_and_script_models():
    slide = CarouselSlideItem(
        slide_number=1,
        header="3 Mistakes to Avoid",
        body="Here is why your marketing strategy is failing.",
        visual_direction_note="Bold red text overlay",
    )
    assert slide.slide_number == 1
    assert slide.header == "3 Mistakes to Avoid"

    scene = ScriptSceneItem(
        scene_number=1,
        timing_seconds=5,
        visual_direction_note="Close-up hook on product packaging",
        spoken_narration="Stop scrolling if you want to grow your brand.",
        onscreen_text="Stop scrolling! 🛑",
    )
    assert scene.timing_seconds == 5
    assert scene.scene_number == 1


def test_planner_content_item_response_serialization():
    item_id = uuid4()
    ws_id = uuid4()
    u_id = uuid4()

    res = PlannerContentItemResponse(
        id=item_id,
        workspace_id=ws_id,
        created_by=u_id,
        title="[INSTAGRAM] Carousel: Hero Product Launch",
        channel=CampaignChannel.instagram,
        channel_type="organic",
        format=ContentFormat.carousel_slides,
        status=ContentStatus.scheduled,
        scheduled_date=date(2026, 8, 25),
        scheduled_time_slot="morning_09_00",
        hook="Why this product is revolutionizing the industry",
        primary_text="Swipe through to see why.",
        structured_content={"slides_count": 5},
        call_to_action="Shop now",
        strategic_rationale="Hero product high-margin awareness pillar.",
        created_at="2026-08-22T00:00:00Z",
        updated_at="2026-08-22T00:00:00Z",
    )
    data = res.model_dump(mode="json")
    assert data["channel"] == "instagram"
    assert data["format"] == "carousel_slides"
    assert data["scheduled_date"] == "2026-08-25"
