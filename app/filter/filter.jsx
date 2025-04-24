// 1. 배경색 변경
// 2. 로컬 이미지 불러오기
// 3. transform 테두리
// 4. undo, redo 기능
// 5. 가이드라인 기능
// 6. 이미지 앞으로 보내는 기능
// 7. 핀치 제스처 추가
// 8. 필터 기능

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Transformer, Line, Rect } from "react-konva";

import { SketchPicker } from "react-color";
import useImage from "use-image";

import NextImage from "next/image";
import styled from "styled-components";

import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/konva";

const width = window.innerWidth;
const height = window.innerHeight;

const deepClone = (arr) => arr.map((item) => ({ ...item }));

const GUIDELINE_OFFSET = 5;

const ImageRectangle = ({
                            shapeRefs,
                            src,
                            onSelect,
                            shapeProps,
                            onChange,
                            onDragMove,
                            onDragEnd,
                            undoRedoState,
                            isSelected,
                        }) => {
    const [image] = useImage(src, "anonymous");

    const shapeRef = useRef();

    useEffect(() => {
        if (shapeRef.current) {
            shapeRefs.current.set(shapeProps.id, shapeRef.current);
        }
    }, [shapeRef.current]);

    useEffect(() => {
        if (shapeRef.current && image) {
            shapeRef.current.cache();
            shapeRef.current.getLayer().batchDraw();
        }
    }, [image]);

    const [style, api] = useSpring(() => ({
        width: shapeProps.width,
        height: shapeProps.height,
        x: shapeProps.width / 2,
        y: shapeProps.height / 2,
        // offsetX: shapeProps.width / 2,
        // offsetY: shapeProps.height / 2,
    }));

    useGesture(
        {
            onDrag: ({ pinching, cancel, offset: [x, y] }) => {
                if (pinching) return cancel();
                api.start({
                    x,
                    y,
                    immediate: true,
                });
                onDragMove("", shapeRef.current);
            },
            onPinch: ({ offset: [s, a] }) => {
                api.start({
                    scale: { x: s, y: s },
                    rotation: a,
                });
            },
            onPinchEnd: ({ offset: [s, a] }) => {
                onChange({
                    ...shapeProps,
                    scale: { x: s, y: s },
                    rotation: a,
                });
            },
            onDragEnd: ({ offset: [x, y] }) => {
                onChange({
                    ...shapeProps,
                    x: style.x.get(),
                    y: style.y.get(),
                });
                if (onDragEnd) {
                    onDragEnd();
                }
            },
        },
        {
            drag: {
                pointer: { capture: false, touch: true },
                from: () => [style.x.get(), style.y.get()],
            },
            pinch: {
                pointer: { touch: true, capture: false },
            },
            target: shapeRef,
        }
    );

    useEffect(() => {
        if (undoRedoState && shapeProps) {
            api.start({
                width: shapeProps.width,
                height: shapeProps.height,
                x: shapeProps.x,
                y: shapeProps.y,
                offsetX: shapeProps.offsetX,
                offsetY: shapeProps.offsetY,
                scale: shapeProps.scale,
                rotation: shapeProps.rotation,
                immediate: true,
            });
            if (shapeRef.current) {
                shapeRef.current.cache();
                shapeRef.current.getLayer()?.batchDraw();
            }
        }
    }, [undoRedoState]);

    useEffect(() => {
        if (shapeRef.current && image) {
            shapeRef.current.cache();
            shapeRef.current.getLayer()?.batchDraw();
        }
    }, [shapeProps.crop]);

    useEffect(() => {
        const node = shapeRef.current;
        if (node) {
            node.clearCache();
            node.cache();
            node.getLayer()?.batchDraw();
        }
    }, [
        image,
        shapeProps.crop,
        shapeProps.filter,
        shapeProps.brightness,
        shapeProps.blurRadius,
        shapeProps.embossStrength,
        shapeProps.pixelSize,
        shapeProps.threshold,
        shapeProps.hue,
        shapeProps.saturation,
        shapeProps.lightness
    ]);

    return (
        <>
            <animated.Image
                name="object" // 가이드라인 기능에서 사용하기 위한 객체명 설정
                image={image}
                ref={shapeRef}
                onClick={onSelect}
                onTap={onSelect}
                {...style}
                width={shapeProps.width}
                height={shapeProps.height}
                crop={shapeProps.crop}
                filters={[
                    ...(shapeProps.filter === 'grayscale' ? [Konva.Filters.Grayscale] : []),
                    ...(shapeProps.filter === 'sepia' ? [Konva.Filters.Sepia] : []),
                    ...(shapeProps.filter === 'blur' ? [Konva.Filters.Blur] : []),
                    ...(shapeProps.filter === 'emboss' ? [Konva.Filters.Emboss] : []),
                    ...(shapeProps.filter === 'invert' ? [Konva.Filters.Invert] : []),
                    ...(shapeProps.filter === 'pixelate' ? [Konva.Filters.Pixelate] : []),
                    ...(shapeProps.filter === 'brightness' ? [Konva.Filters.Brighten] : []),
                    ...(shapeProps.filter === 'threshold' ? [Konva.Filters.Threshold] : []),
                    ...(shapeProps.filter === 'noise' ? [Konva.Filters.Noise] : []),
                    ...(shapeProps.filter === 'hsl' ? [Konva.Filters.HSL] : []),
                ]}
                brightness={shapeProps.brightness}
                threshold={shapeProps.threshold}
                noise={shapeProps.noise}
                hue={shapeProps.hue}
                saturation={shapeProps.saturation}
                lightness={shapeProps.lightness}
                blurRadius={shapeProps.blurRadius}
                pixelSize={shapeProps.pixelSize}
            />
        </>
    );
};

const App = () => {
    const stageRef = useRef(null);
    const shapeRefs = useRef(new Map());
    const imagesLayerRef = useRef(null); // 레이어 ref

    const [images, setImages] = useState([]);
    const [selectedId, selectShape] = useState(null);

    const [color, setColor] = useState("#fff");
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const [undoRedoState, setUndoRedoState] = useState(0);

    // 가이드라인 상태 추가
    const [guidelines, setGuidelines] = useState([]);

    // cropping 상태 추가
    const [cropMode, setCropMode] = useState(false);
    const [cropRect, setCropRect] = useState(null);
    const cropRectRef = useRef(null);
    const cropTransformerRef = useRef(null);

    const [activeSlider, setActiveSlider] = useState(null); // 필터 타입
    const [sliderPos, setSliderPos] = useState({ x: 0, y: 0 }); // 슬라이더 위치

    const applyHistory = (nextImages, nextColor = color) => {
        setImages(nextImages);
        setColor(nextColor);
        setHistory((prev) => [
            ...prev,
            {
                images: deepClone(nextImages),
                color: nextColor,
            },
        ]);
        setRedoStack([]);
    };

    const handleChangeComplete = (color) => {
        const container = stageRef.current.container();
        container.style.backgroundColor = color.hex;
        applyHistory(images, color.hex);
    };

    // 로컬 이미지 파일 추가
    const fileInputOnChange = async (e) => {
        if (!e.target.files[0]) return;

        const URL = window.webkitURL || window.URL;
        const url = URL.createObjectURL(e.target.files[0]);
        const img = new window.Image();
        img.src = url;

        img.onload = () => {
            const { width, height } = img;

            // get the aperture we need to fit by taking padding off the stage size.
            var targetW = stageRef.current.getWidth() - 2;
            var targetH = stageRef.current.getHeight() - 2;

            // compute the ratios of image dimensions to aperture dimensions
            var widthFit = targetW / width;
            var heightFit = targetH / height;

            // compute a scale for best fit and apply it
            var scale = widthFit > heightFit ? heightFit : widthFit;

            var fitW = parseInt(width * scale, 10);
            var fitH = parseInt(height * scale, 10);

            const newImage = {
                url: url,
                id: Math.floor(Math.random() * 9999) + 1,
                x: stageRef.current.width() / 4,
                y: stageRef.current.height() / 4,
                width: fitW,
                height: fitH,
                // offsetX: stageRef.current.width() / 2,
                // offsetY: stageRef.current.height() / 2,
                scale: { x: 1, y: 1 },
                rotation: 0,
                origWidth: img.naturalWidth,
                origHeight: img.naturalHeight,
                resizeRatio: {
                    x: fitW / img.naturalWidth,
                    y: fitH / img.naturalHeight,
                },
                crop: {
                    x: 0,
                    y: 0,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                },
                filters: [], // 필터 배열
                brightness: 0, // 필터 값
            };

            const updatedImages = [...images, newImage];
            setImages(updatedImages);
            applyHistory(updatedImages);
        };
    };

    // transformer 터치이벤트 받기

    const checkDeselect = (e) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
            setColorPickerOpen(false);
            setActiveSlider(null);
        }
    };

    const undo = () => {
        if (history.length <= 1) return; // 더 이상 되돌릴 게 없음

        const prev = history[history.length - 2]; // 되돌릴 상태
        const current = history[history.length - 1]; // 현재 상태

        setImages(prev.images);
        setColor(prev.color);

        setHistory((prevList) => prevList.slice(0, -1)); // 마지막 하나 제거
        setRedoStack((prevList) => [...prevList, current]); // 현재 상태를 redo에 추가
        setUndoRedoState((state) => state + 1);
        setCropMode(false); // 크롭 모드 종료
        setActiveSlider(null);
        if (!prev.images.find((img) => img.id === selectedId)) {
            selectShape(null);
        }
    };

    const redo = () => {
        if (redoStack.length === 0) return;

        const next = redoStack[redoStack.length - 1];

        // Redo 상태 적용
        setImages(next.images);
        setColor(next.color);

        // history에 추가하고, redoStack에서 제거
        setHistory((prevList) => [...prevList, next]);
        setRedoStack((prevList) => prevList.slice(0, -1));
        setUndoRedoState((state) => state + 1);
        setCropMode(false); // 크롭 모드 종료
    };

    //이미지 저장
    const handleExport = () => {
        const stage = stageRef.current;
        if (!stage) return;

        // 현재 보이는 모든 Transformer 잠시 숨기기
        const transformers = stage.find("Transformer");
        transformers.forEach((tr) => tr.hide());
        stage.draw(); // 즉시 리렌더링

        // 이미지(Transformer 제외)만 DataURL로 추출
        const uri = stage.toDataURL({ pixelRatio: 2 });

        // 파일로 저장
        const link = document.createElement("a");
        link.download = "canvas-export.png";
        link.href = uri;
        link.click();

        // Transformer 다시 보이게
        transformers.forEach((tr) => tr.show());
        stage.draw();
    };

    // 앞으로가기 뒤로가기
    const bringToFront = () => {
        const idx = images.findIndex((img) => img.id === selectedId);
        if (idx === -1 || idx === images.length - 1) return; // 이미 최상위
        const newImages = [...images];
        [newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]]; // swap
        applyHistory(newImages);
        setUndoRedoState((state) => state + 1);
    };

    const sendToBack = () => {
        const idx = images.findIndex((img) => img.id === selectedId);
        if (idx <= 0) return; // 이미 최하위
        const newImages = [...images];
        [newImages[idx - 1], newImages[idx]] = [newImages[idx], newImages[idx - 1]]; // swap
        applyHistory(newImages);
        setUndoRedoState((state) => state + 1);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === "z") {
                e.preventDefault();
                undo();
            } else if (e.ctrlKey && e.key === "y") {
                e.preventDefault();
                redo(); // Ctrl+Y로 다시 실행
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, redoStack]);

    useEffect(() => {
        if (history.length === 0) {
            setHistory([
                {
                    images: [],
                    color: "#fff",
                },
            ]);
        }
    }, []);

    useEffect(() => {
        const container = stageRef.current?.container();
        if (container) {
            container.style.backgroundColor = color;
        }
    }, [color]);

    useEffect(() => {
        if (cropTransformerRef.current) {
            // 회전 기능을 비활성화합니다.
            cropTransformerRef.current.rotateEnabled(false);
            // 회전 연결 선도 숨깁니다.
            cropTransformerRef.current.rotateLineVisible(false);
        }
    }, [cropMode]);

    // 가이드라인 관련 헬퍼 함수들
    const getLineGuideStops = (skipShape) => {
        const stage = stageRef.current;
        const vertical = [0, stage.width() / 2, stage.width()];
        const horizontal = [0, stage.height() / 2, stage.height()];

        stage.find(".object").forEach((guideItem) => {
            if (guideItem === skipShape) return;

            const box = guideItem.getClientRect({ skipStroke: true });
            vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
            horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
        });

        return { vertical, horizontal };
    };

    const getObjectSnappingEdges = (node) => {
        const box = node.getClientRect({ skipStroke: true });
        const absPos = node.absolutePosition();

        return {
            vertical: [
                {
                    guide: box.x,
                    offset: absPos.x - box.x,
                    snap: "start",
                },
                {
                    guide: box.x + box.width / 2,
                    offset: absPos.x - (box.x + box.width / 2),
                    snap: "center",
                },
                {
                    guide: box.x + box.width,
                    offset: absPos.x - (box.x + box.width),
                    snap: "end",
                },
            ],
            horizontal: [
                {
                    guide: box.y,
                    offset: absPos.y - box.y,
                    snap: "start",
                },
                {
                    guide: box.y + box.height / 2,
                    offset: absPos.y - (box.y + box.height / 2),
                    snap: "center",
                },
                {
                    guide: box.y + box.height,
                    offset: absPos.y - (box.y + box.height),
                    snap: "end",
                },
            ],
        };
    };

    const getGuides = (lineGuideStops, itemBounds) => {
        let resultV = [];
        let resultH = [];

        lineGuideStops.vertical.forEach((lineGuide) => {
            itemBounds.vertical.forEach((itemBound) => {
                const diff = Math.abs(lineGuide - itemBound.guide);
                // if the distance between guild line and object snap point is close we can consider this for snapping
                if (diff < GUIDELINE_OFFSET) {
                    resultV.push({
                        lineGuide: lineGuide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                    });
                }
            });
        });

        lineGuideStops.horizontal.forEach((lineGuide) => {
            itemBounds.horizontal.forEach((itemBound) => {
                const diff = Math.abs(lineGuide - itemBound.guide);
                if (diff < GUIDELINE_OFFSET) {
                    resultH.push({
                        lineGuide: lineGuide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                    });
                }
            });
        });

        const guides = [];

        const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
        const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
        if (minV) {
            guides.push({
                lineGuide: minV.lineGuide,
                offset: minV.offset,
                orientation: "V",
                snap: minV.snap,
            });
        }
        if (minH) {
            guides.push({
                lineGuide: minH.lineGuide,
                offset: minH.offset,
                orientation: "H",
                snap: minH.snap,
            });
        }
        return guides;
    };

    // 가이드라인 스냅 기능을 위한 드래그 무브 핸들러
    const handleDragMove = (e, node) => {
        // 기존 가이드라인 라인 제거 (state 초기화)
        setGuidelines([]);
        const lineGuideStops = getLineGuideStops(node);
        const itemBounds = getObjectSnappingEdges(node);
        const guides = getGuides(lineGuideStops, itemBounds);

        if (guides.length) {
            let absPos = node.absolutePosition();
            guides.forEach((lg) => {
                switch (lg.orientation) {
                    case "V": {
                        absPos.x = lg.lineGuide + lg.offset;
                        break;
                    }
                    case "H": {
                        absPos.y = lg.lineGuide + lg.offset;
                        break;
                    }
                }
            });
            node.absolutePosition(absPos);
        }
        setGuidelines(guides);
    };

    // 드래그 종료 시 가이드라인 클리어
    const handleDragEnd = () => {
        setGuidelines([]);
    };

    // cropping 기능 추가
    const startCropMode = () => {
        if (!selectedId) return;
        const node = shapeRefs.current.get(selectedId);
        if (!node) return;

        const box = node.getClientRect({ skipStroke: true });

        setCropRect({
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            width: box.width,
            height: box.height,
            rotation: node.rotation(), // 회전값 포함
        });
        setCropMode(true);
        setActiveSlider(null);
    };

    const handleConfirmCrop = () => {
        if (!selectedId || !cropRect) return;
        const index = images.findIndex((img) => img.id === selectedId);
        if (index === -1) return;
        const img = images[index];
        const node = shapeRefs.current.get(selectedId);
        if (!node) return;

        const absPos = node.absolutePosition();
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation() * (Math.PI / 180);

        // crop 박스의 왼쪽 상단 좌표
        const cropBoxX = cropRect.x - cropRect.width / 2;
        const cropBoxY = cropRect.y - cropRect.height / 2;

        // crop 박스 기준점에서 이미지 위치까지 벡터
        const dx = cropBoxX - absPos.x;
        const dy = cropBoxY - absPos.y;

        // 회전 보정 (이미지 로컬 좌표로 변환)
        const localX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation);
        const localY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation);

        // 이미지 축소되었으면 비율 보정
        const resizeRatioX = img.width / (img.crop?.width || img.origWidth);
        const resizeRatioY = img.height / (img.crop?.height || img.origHeight);

        const cropX = (img.crop?.x || 0) + localX / scaleX / resizeRatioX;
        const cropY = (img.crop?.y || 0) + localY / scaleY / resizeRatioY;
        const cropWidth = cropRect.width / scaleX / resizeRatioX;
        const cropHeight = cropRect.height / scaleY / resizeRatioY;

        const newCrop = {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight,
        };

        // 업데이트시에는 crop 프로퍼티를 갱신하여 재크롭도 원본에 맞게 누적됨
        const updatedImage = {
            ...img,
            x: cropRect.x - (cropRect.width / 2),
            y: cropRect.y - (cropRect.height / 2),
            width: cropRect.width,
            height: cropRect.height,
            scale: { x: 1, y: 1 },
            crop: newCrop,
        };
        const newImages = [...images];
        newImages[index] = updatedImage;
        setImages(newImages);
        applyHistory(newImages);
        setCropMode(false);
        setCropRect(null);
        selectShape(null);
        setUndoRedoState((state) => state + 1);
        setActiveSlider(null);
    };

    const handleCancelCrop = () => {
        setCropMode(false);
        setCropRect(null);
    };

    useEffect(() => {
        if (cropMode && cropRectRef.current && cropTransformerRef.current) {
            cropTransformerRef.current.nodes([cropRectRef.current]);
            cropTransformerRef.current.getLayer().batchDraw();
        }
    }, [cropMode, cropRect]);

    //이미지 삭제
    const deleteSelected = () => {
        if (!selectedId) return;
        const newImages = images.filter((img) => img.id !== selectedId);
        applyHistory(newImages);
        selectShape(null);
    };

    const selectedImage = images.find(img => img.id === selectedId);

    const updateFilter = (type) => {
        const idx = images.findIndex(i => i.id === selectedId);
        if (idx === -1) return;
        const next = [...images];
        next[idx] = {
            ...next[idx],
            filter: type,
            blurRadius: type === "blur" ? 10 : 0,
            embossStrength: type === "emboss" ? 1 : 0,
            pixelSize: type === "pixelate" ? 10 : 0,
            brightness: type === "brightness" ? 0.5 : 0,
            threshold: type === "threshold" ? 0.5 : 0,
            noise: type === "noise" ? 0.5 : 0,
            red: next[idx].red ?? 1,
            green: next[idx].green ?? 1,
            blue: next[idx].blue ?? 1,
            hue: type === "hsl" ? 0 : 0,
            saturation: type === "hsl" ? 1 : 0,
            lightness: type === "hsl" ? 0.5 : 0,
        };
        setImages(next);
        applyHistory(next);
        selectShape(next[idx].id); // ensure re-render

        // 슬라이더를 지원하는 필터만 슬라이더 위치 계산
        const hasSlider = [
            "blur",
            "emboss",
            "pixelate",
            "brightness",
            "threshold",
            "noise",
            "hsl"
        ].includes(type);
        if (hasSlider) {
            const button = document.getElementById(`filter-btn-${type}`);
            if (button) {
                const rect = button.getBoundingClientRect();
                setSliderPos({ x: rect.left + rect.width / 2, y: rect.top });
                setActiveSlider(type);
            }
        } else {
            setActiveSlider(null); // 슬라이더 숨기기
        }
    };

    const getSliderMin = (type) => {
        switch (type) {
            case "blur": return 0;
            case "pixelate": return 1;
            case "emboss": return 0;
            case "brightness": return 0;
            default: return 0;
        }
    };

    const getSliderMax = (type) => {
        switch (type) {
            case "blur": return 50;
            case "pixelate": return 50;
            case "emboss": return 10;
            case "brightness": return 2;
            case "threshold": return 1;
            case "noise": return 1;
            case "red":
            case "green":
            case "blue":
            case "alpha": return 1;
            case "hue": return 360;
            case "saturation":
            case "lightness": return 1;
            default: return 1;
        }
    };

    const getSliderStep = (type) => {
        switch (type) {
            case "emboss": return 0.1;
            case "blur":
            case "pixelate": return 1;
            case "brightness": return 0.01;
            default: return 0.01;
        }
    };

    const getSliderValue = (type) => {
        const idx = images.findIndex((img) => img.id === selectedId);
        if (idx === -1) return 0;
        const img = images[idx];
        switch (type) {
            case "blur": return img.blurRadius ?? 0;
            case "pixelate": return img.pixelSize ?? 1;
            case "emboss": return img.embossStrength ?? 0;
            case "brightness": return img.brightness ?? 0;
            case "threshold": return img.threshold ?? 0;
            case "noise": return img.noise ?? 0;
            case "hsl": return img.hue ?? 0;
            case "red": return img.red ?? 1;
            case "green": return img.green ?? 1;
            case "blue": return img.blue ?? 1;
            case "hue": return img.hue ?? 0;
            case "saturation": return img.saturation ?? 1;
            case "lightness": return img.lightness ?? 0.5;
            default: return 0;
        }
    };

    // 값 변경만 하는 함수
    const updateImageFilter = (type, value) => {
        const idx = images.findIndex(i => i.id === selectedId);
        if (idx === -1) return;

        const next = [...images];
        if (["red", "green", "blue"].includes(type)) {
            next[idx] = {
                ...next[idx],
                red: type === "red" ? value : next[idx].red,
                green: type === "green" ? value : next[idx].green,
                blue: type === "blue" ? value : next[idx].blue,
            };
        } else if (["hue", "saturation", "lightness"].includes(type)) {
            next[idx] = {
                ...next[idx],
                hue: type === "hue" ? value : next[idx].hue,
                saturation: type === "saturation" ? value : next[idx].saturation,
                lightness: type === "lightness" ? value : next[idx].lightness,
            };
        } else {
            const keyMap = {
                blur: "blurRadius",
                pixelate: "pixelSize",
                emboss: "embossStrength",
                brightness: "brightness",
                threshold: "threshold",
                noise: "noise",
                hsl: "hue",
            };
            next[idx] = {
                ...next[idx],
                [keyMap[type]]: value,
            };
        }

        setImages(next);
        selectShape(next[idx].id);
    };

    // 히스토리에 최종 저장
    const commitSliderChange = () => {
        applyHistory(images);
    };

    return (
        <>
            <Stage
                width={width}
                height={height}
                ref={stageRef}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                style={{ touchAction: "none" }}
            >
                <Layer ref={imagesLayerRef}>
                    {images.map((image, i) => {
                        return (
                            <ImageRectangle
                                shapeRefs={shapeRefs}
                                key={i}
                                src={image.url}
                                shapeProps={image}
                                undoRedoState={undoRedoState}
                                isSelected={image.id === selectedId}
                                onSelect={() => {
                                    selectShape(image.id);
                                }}
                                onChange={(newAttrs) => {
                                    const rects = images.slice();
                                    rects[i] = newAttrs;
                                    applyHistory(rects);
                                }}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                            />
                        );
                    })}
                </Layer>
                <Layer>
                    {guidelines.map((guide, index) => {
                        if (guide.orientation === "H") {
                            return (
                                <Line
                                    key={index}
                                    points={[-6000, guide.lineGuide, 6000, guide.lineGuide]}
                                    stroke="rgb(0, 161, 255)"
                                    strokeWidth={1}
                                    dash={[4, 6]}
                                />
                            );
                        } else if (guide.orientation === "V") {
                            return (
                                <Line
                                    key={index}
                                    points={[guide.lineGuide, -6000, guide.lineGuide, 6000]}
                                    stroke="rgb(0, 161, 255)"
                                    strokeWidth={1}
                                    dash={[4, 6]}
                                />
                            );
                        }
                        return null;
                    })}
                </Layer>

                {cropMode && cropRect && (
                    <Layer>
                        <Rect
                            x={cropRect.x}
                            y={cropRect.y}
                            width={cropRect.width}
                            height={cropRect.height}
                            rotation={cropRect.rotation} // 회전값 추가
                            offsetX={cropRect.width  / 2}
                            offsetY={cropRect.height / 2}
                            stroke="red"
                            dash={[4, 4]}
                            draggable
                            onDragEnd={(e) => {
                                setCropRect({
                                    ...cropRect,
                                    x: e.target.x(),
                                    y: e.target.y(),
                                });
                            }}
                            onTransformEnd={(e) => {
                                const node = e.target;
                                const scaleX = node.scaleX();
                                const scaleY = node.scaleY();
                                setCropRect({
                                    x: node.x(),
                                    y: node.y(),
                                    width: Math.max(5, node.width() * scaleX),
                                    height: Math.max(5, node.height() * scaleY),
                                    rotation: node.rotation(), // 회전값 업데이트
                                });
                                node.scaleX(1);
                                node.scaleY(1);
                            }}
                            ref={cropRectRef}
                        />
                        <Transformer ref={cropTransformerRef} />
                    </Layer>
                )}
            </Stage>

            {colorPickerOpen && (
                <ColorPickerContainer>
                    <SketchPicker color={color} onChange={handleChangeComplete} />
                </ColorPickerContainer>
            )}

            <div className="text-center">
                <ToolBarContainer>
                    <button
                        onClick={() => setColorPickerOpen(!colorPickerOpen)}
                        title="배경색 선택"
                    >
                        <NextImage
                            src={"./images/color-picker-icon.png"}
                            width={25}
                            height={25}
                            alt="background-color-picker-icon"
                        />
                    </button>

                    <InputFileLabel title="이미지 추가">
                        <InputFile
                            type="file"
                            id="file_input"
                            onChange={fileInputOnChange}
                        />
                        <NextImage
                            src={"./images/image-square.png"}
                            width={25}
                            height={25}
                            alt="import-image-icon"
                        />
                    </InputFileLabel>

                    <InputFileLabel title="이미지 추가">
                        <InputFile
                            type="file"
                            id="file_input"
                            onChange={fileInputOnChange}
                        />
                        <NextImage
                            src={"./images/plus.png"}
                            width={25}
                            height={25}
                            alt="plus-icon"
                        />
                    </InputFileLabel>

                    <button onClick={undo} title="되돌리기 (Ctrl+Z)">
                        <NextImage
                            src={"./images/arrow-u-down-undo.png"}
                            width={25}
                            height={25}
                            alt="undo-icon"
                        />
                    </button>
                    <button onClick={redo} title="다시 실행 (Ctrl+Y)">
                        <NextImage
                            src={"./images/arrow-u-down-redo.png"}
                            width={25}
                            height={25}
                            alt="redo-icon"
                        />
                    </button>

                    <button onClick={handleExport} title="이미지 저장">
                        <NextImage
                            src={"./images/save.png"}
                            width={25}
                            height={25}
                            alt="redo-icon"
                        />
                    </button>
                    <button onClick={deleteSelected} title="삭제">
                        <NextImage
                            src={"./images/trash.png"}
                            width={25}
                            height={25}
                            alt="delete-icon"
                        />
                    </button>

                    {selectedId && (
                        <>
                            <button title="인덱스 하나 앞으로 이동" onClick={bringToFront}>
                                <NextImage
                                    src={"./images/foward.png"}
                                    width={25}
                                    height={25}
                                    alt="redo-icon"
                                />
                            </button>
                            <button
                                title="인덱스 하나 뒤로 이동"
                                onClick={sendToBack}
                                style={{ marginLeft: 10 }}
                            >
                                <NextImage
                                    src={"./images/backward.png"}
                                    width={25}
                                    height={25}
                                    alt="redo-icon"
                                />
                            </button>
                        </>
                    )}
                    {/* <button
            onClick={() => {
              if (!selectedId) return;
              const index = images.findIndex((img) => img.id === selectedId);
              if (index === -1) return;

              const newImages = [...images];
              const [selected] = newImages.splice(index, 1);
              newImages.push(selected);
              setImages(newImages);
              applyHistory(newImages);
            }}
            title="이미지 앞으로 보내기"
          >
            <NextImage
              src={"./images/layer-forward.png"}
              width={25}
              height={25}
              alt="bring-forward-icon"
            />
          </button> */}
                    {selectedImage && (
                        <FilterBar>
                            {!cropMode && (
                                <FilterButton $variant="crop" onClick={startCropMode}>Crop</FilterButton>
                            )}
                            {cropMode && (
                                <>
                                    <FilterButton $variant="crop" onClick={handleConfirmCrop} title="크롭 적용">Confirm</FilterButton>
                                    <FilterButton $variant="crop" onClick={handleCancelCrop} title="크롭 취소">Cancel</FilterButton>
                                </>
                            )}
                            <FilterButton $active={selectedImage.filter === "none"} onClick={() => updateFilter('none')}>None</FilterButton>
                            <FilterButton id="filter-btn-grayscale" $active={selectedImage.filter === "grayscale"} onClick={() => updateFilter('grayscale')}>Grayscale</FilterButton>
                            <FilterButton id="filter-btn-sepia" $active={selectedImage.filter === "sepia"} onClick={() => updateFilter('sepia')}>Sepia</FilterButton>
                            <FilterButton id="filter-btn-blur" $active={selectedImage.filter === "blur"} onClick={() => updateFilter('blur')}>Blur</FilterButton>
                            <FilterButton id="filter-btn-invert" $active={selectedImage.filter === "invert"} onClick={() => updateFilter('invert')}>Invert</FilterButton>
                            <FilterButton id="filter-btn-pixelate" $active={selectedImage.filter === "pixelate"} onClick={() => updateFilter('pixelate')}>Pixelate</FilterButton>
                            <FilterButton id="filter-btn-brightness" $active={selectedImage.filter === "brightness"} onClick={() => updateFilter('brightness')}>Brightness</FilterButton>
                            <FilterButton id="filter-btn-hsl" $active={selectedImage.filter === "hsl"} onClick={() => updateFilter('hsl')}>HSL</FilterButton>
                            <FilterButton id="filter-btn-threshold" $active={selectedImage.filter === "threshold"} onClick={() => updateFilter('threshold')}>Threshold</FilterButton>
                            <FilterButton id="filter-btn-noise" $active={selectedImage.filter === "noise"} onClick={() => updateFilter('noise')}>Noise</FilterButton>
                        </FilterBar>
                    )}
                </ToolBarContainer>
            </div>
            {activeSlider && (
                <div
                    style={{
                        position: "absolute",
                        top: `${sliderPos.y - 60}px`,
                        left: `${sliderPos.x}px`,
                        transform: "translateX(-50%)",
                        background: "#fff",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        zIndex: 9999,
                    }}
                >
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>{activeSlider}</label>
                    {["hsl"].includes(activeSlider) ? (
                        <>
                            {activeSlider === "hsl" && (
                                <>
                                    <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        step={1}
                                        value={images.find(i => i.id === selectedId)?.hue ?? 0}
                                        onChange={(e) => updateImageFilter("hue", parseFloat(e.target.value))}
                                        onMouseUp={commitSliderChange}
                                        onTouchEnd={commitSliderChange}
                                    />
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={images.find(i => i.id === selectedId)?.saturation ?? 1}
                                        onChange={(e) => updateImageFilter("saturation", parseFloat(e.target.value))}
                                        onMouseUp={commitSliderChange}
                                        onTouchEnd={commitSliderChange}
                                    />
                                </>
                            )}
                        </>
                    ) : (
                        <input
                            type="range"
                            min={getSliderMin(activeSlider)}
                            max={getSliderMax(activeSlider)}
                            step={getSliderStep(activeSlider)}
                            value={getSliderValue(activeSlider)}
                            onChange={(e) => updateImageFilter(activeSlider, parseFloat(e.target.value))}
                            onMouseUp={commitSliderChange}
                            onTouchEnd={commitSliderChange}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default App;

const ToolBarContainer = styled.div`
  position: absolute;

  display: flex;
  column-gap: 24px;

  left: 50%;
  bottom: 0;
  transform: translate(-50%, -50%);

  padding: 14px 31px;
  border-radius: 80px;
  background-color: rgba(0, 0, 0, 0.5);

  img {
    width: 25px;
  }
`;

const InputFile = styled.input`
    position: absolute;
    width: 0;
    height: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
`;

const InputFileLabel = styled.label`
    cursor: pointer;
`;

const ColorPickerContainer = styled.div`
    position: absolute;
    z-index: 999;

    bottom: 0;
    left: 50%;
    transform: translate(-50%, -30%);
`;

const FilterBar = styled.div`
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;

    max-width: 90vw;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;

    padding: 8px 12px;
    border-radius: 20px;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 999;
`;

const FilterButton = styled.button`
    padding: 6px 12px;
    background: ${({ $active, $variant }) =>
            $variant === "crop" ? "#ffe0b2" : $active ? "#ddd" : "white"};
    border-radius: 8px;
    border: none;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
`;