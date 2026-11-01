#!/usr/bin/env python3
"""
Spider Engine - AI Image-to-3D Mesh Generator
Converts any 2D AI-generated concept image into a watertight 3D mesh (.obj + .mtl)
with full UV texture mapping and volumetric depth.
"""

import os
import sys
import argparse
import numpy as np
from PIL import Image

def image_to_3d_mesh(
    image_path: str,
    output_obj: str,
    grid_size: int = 140,
    depth_scale: float = 0.45,
    smooth_sigma: float = 1.2
):
    print(f"[*] Loading input image: {image_path}")
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")

    img = Image.open(image_path).convert("RGB")
    w_orig, h_orig = img.size

    # Resize to uniform grid for mesh triangulation
    grid_w = grid_size
    grid_h = int(grid_size * (h_orig / w_orig))
    img_resized = img.resize((grid_w, grid_h), Image.Resampling.LANCZOS)
    img_arr = np.array(img_resized, dtype=np.float32) / 255.0

    # Calculate perceptual luminance (depth map foundation)
    lum = 0.299 * img_arr[:, :, 0] + 0.587 * img_arr[:, :, 1] + 0.114 * img_arr[:, :, 2]

    # Detect background (corners/edges) to mask and pop foreground subject
    corner_samples = [
        lum[:5, :5].mean(),
        lum[:5, -5:].mean(),
        lum[-5:, :5].mean(),
        lum[-5:, -5:].mean()
    ]
    bg_lum = np.median(corner_samples)
    bg_diff = np.abs(lum - bg_lum)
    fg_mask = np.clip((bg_diff - 0.08) / 0.25, 0.0, 1.0)

    # Spherical / ellipsoidal volumetric envelope (gives it realistic 3D fullness)
    y_coords, x_coords = np.mgrid[0:grid_h, 0:grid_w]
    cx = grid_w / 2.0
    cy = grid_h / 2.0
    nx = (x_coords - cx) / cx
    ny = (y_coords - cy) / cy
    r2 = np.clip(1.0 - (nx**2 + ny**2), 0.0, 1.0)
    dome = np.sqrt(r2)

    # Combine luminance detail with volumetric shape and foreground mask
    depth_front = (dome * 0.65 + lum * 0.35) * fg_mask * depth_scale

    # Smooth depth to prevent harsh jagged geometry
    try:
        from scipy.ndimage import gaussian_filter
        depth_front = gaussian_filter(depth_front, sigma=smooth_sigma)
    except ImportError:
        # Fallback simple 3x3 box blur if scipy is not installed
        kernel = np.ones((3, 3), dtype=np.float32) / 9.0
        padded = np.pad(depth_front, 1, mode='edge')
        smoothed = np.zeros_like(depth_front)
        for dy in range(3):
            for dx in range(3):
                smoothed += kernel[dy, dx] * padded[dy:dy+grid_h, dx:dx+grid_w]
        depth_front = smoothed

    # Back depth creates symmetry for a solid watertight 3D body
    depth_back = -depth_front * 0.7

    print(f"[*] Generating 3D mesh vertices ({grid_w}x{grid_h} grid)...")

    # Coordinate ranges normalized around center (0,0,0)
    aspect = grid_w / grid_h
    scale_x = aspect * 2.0
    scale_y = 2.0

    vertices = []
    uvs = []

    # 1. Front surface vertices
    for y in range(grid_h):
        for x in range(grid_w):
            vx = ((x / (grid_w - 1)) - 0.5) * scale_x
            vy = (0.5 - (y / (grid_h - 1))) * scale_y
            vz = depth_front[y, x]
            vertices.append((vx, vy, vz))
            uvs.append((x / (grid_w - 1), 1.0 - (y / (grid_h - 1))))

    # 2. Back surface vertices
    back_offset = len(vertices)
    for y in range(grid_h):
        for x in range(grid_w):
            vx = ((x / (grid_w - 1)) - 0.5) * scale_x
            vy = (0.5 - (y / (grid_h - 1))) * scale_y
            vz = depth_back[y, x]
            vertices.append((vx, vy, vz))
            uvs.append((x / (grid_w - 1), 1.0 - (y / (grid_h - 1))))

    faces = []

    # Triangulate front surface
    for y in range(grid_h - 1):
        for x in range(grid_w - 1):
            i0 = y * grid_w + x + 1
            i1 = i0 + 1
            i2 = (y + 1) * grid_w + x + 1
            i3 = i2 + 1
            faces.append((i0, i2, i1))
            faces.append((i1, i2, i3))

    # Triangulate back surface (reversed winding)
    for y in range(grid_h - 1):
        for x in range(grid_w - 1):
            i0 = back_offset + y * grid_w + x + 1
            i1 = i0 + 1
            i2 = back_offset + (y + 1) * grid_w + x + 1
            i3 = i2 + 1
            faces.append((i0, i1, i2))
            faces.append((i1, i3, i2))

    # Stitch edge perimeter walls between front and back (watertight solid)
    # Top edge (y=0)
    for x in range(grid_w - 1):
        f0 = x + 1
        f1 = f0 + 1
        b0 = back_offset + x + 1
        b1 = b0 + 1
        faces.append((f0, f1, b1))
        faces.append((f0, b1, b0))

    # Bottom edge (y=grid_h-1)
    bottom_y = grid_h - 1
    for x in range(grid_w - 1):
        f0 = bottom_y * grid_w + x + 1
        f1 = f0 + 1
        b0 = back_offset + bottom_y * grid_w + x + 1
        b1 = b0 + 1
        faces.append((f0, b1, f1))
        faces.append((f0, b0, b1))

    # Left edge (x=0)
    for y in range(grid_h - 1):
        f0 = y * grid_w + 1
        f1 = (y + 1) * grid_w + 1
        b0 = back_offset + y * grid_w + 1
        b1 = back_offset + (y + 1) * grid_w + 1
        faces.append((f0, b1, f1))
        faces.append((f0, b0, b1))

    # Right edge (x=grid_w-1)
    for y in range(grid_h - 1):
        f0 = (y + 1) * grid_w
        f1 = (y + 2) * grid_w
        b0 = back_offset + (y + 1) * grid_w
        b1 = back_offset + (y + 2) * grid_w
        faces.append((f0, f1, b1))
        faces.append((f0, b1, b0))

    # Write OBJ and MTL files
    base_name = os.path.splitext(output_obj)[0]
    mtl_filename = os.path.basename(base_name) + ".mtl"
    tex_filename = os.path.basename(base_name) + "_tex.png"
    out_dir = os.path.dirname(output_obj) or "."
    mtl_path = os.path.join(out_dir, mtl_filename)
    tex_path = os.path.join(out_dir, tex_filename)

    # Save texture alongside the mesh
    img.save(tex_path, "PNG")

    # Write .mtl material definition
    with open(mtl_path, "w", encoding="utf-8") as f:
        f.write("# Spider Engine Procedural Material\n")
        f.write("newmtl Material_Generated\n")
        f.write("Ka 1.000 1.000 1.000\n")
        f.write("Kd 1.000 1.000 1.000\n")
        f.write("Ks 0.200 0.200 0.200\n")
        f.write("Ns 40.0\n")
        f.write("d 1.0\n")
        f.write(f"map_Kd {tex_filename}\n")

    # Write .obj 3D mesh
    print(f"[*] Writing 3D OBJ file to: {output_obj}")
    with open(output_obj, "w", encoding="utf-8") as f:
        f.write("# Spider Game Engine - AI Image-to-3D Export\n")
        f.write(f"mtllib {mtl_filename}\n")
        f.write("o AI_Generated_Prop\n")

        for v in vertices:
            f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")

        for uv in uvs:
            f.write(f"vt {uv[0]:.4f} {uv[1]:.4f}\n")

        f.write("usemtl Material_Generated\n")
        f.write("s 1\n")
        for face in faces:
            # v/vt face formatting
            f.write(f"f {face[0]}/{face[0]} {face[1]}/{face[1]} {face[2]}/{face[2]}\n")

    # Also export self-contained binary GLB for instant Three.js / R3F useGLTF loading
    glb_path = os.path.splitext(output_obj)[0] + ".glb"
    try:
        import trimesh
        mesh = trimesh.load(output_obj)
        mesh.export(glb_path)
        glb_size_kb = os.path.getsize(glb_path) / 1024
        print(f"    - GLB Path: {glb_path} ({glb_size_kb:.1f} KB) [Binary packed ready for useGLTF]")
    except Exception as e:
        print(f"    - Note: GLB export skipped: {e}")

    file_size_kb = os.path.getsize(output_obj) / 1024
    print(f"[+] Success! Generated 3D Mesh:")
    print(f"    - Vertices: {len(vertices):,}")
    print(f"    - Faces: {len(faces):,}")
    print(f"    - OBJ Path: {output_obj} ({file_size_kb:.1f} KB)")
    print(f"    - MTL Path: {mtl_path}")
    print(f"    - Texture:  {tex_path}")

def image_to_3d_terrain(
    image_path: str,
    output_obj: str,
    grid_size: int = 160,
    terrain_width: float = 240.0,
    terrain_depth: float = 240.0,
    height_scale: float = 16.0,
    center_flat_radius: float = 15.0,
    smooth_sigma: float = 1.6
):
    print(f"[*] Generating 3D Terrain Mesh from: {image_path}")
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")

    img = Image.open(image_path).convert("RGB")
    w_orig, h_orig = img.size

    grid_w = grid_size
    grid_h = grid_size
    img_resized = img.resize((grid_w, grid_h), Image.Resampling.LANCZOS)
    img_arr = np.array(img_resized, dtype=np.float32) / 255.0

    # Luminance as primary height detail
    lum = 0.299 * img_arr[:, :, 0] + 0.587 * img_arr[:, :, 1] + 0.114 * img_arr[:, :, 2]

    # Create terrain heightmap
    y_coords, x_coords = np.mgrid[0:grid_h, 0:grid_w]
    cx = grid_w / 2.0
    cy = grid_h / 2.0

    # Distance from center in world units
    dist_x = ((x_coords - cx) / cx) * (terrain_width / 2.0)
    dist_z = ((y_coords - cy) / cy) * (terrain_depth / 2.0)
    radial_dist = np.sqrt(dist_x**2 + dist_z**2)

    # Edge mountain elevation
    edge_elevation = np.clip((radial_dist - center_flat_radius) / (terrain_width * 0.45), 0.0, 1.0) ** 1.4

    # Horizon mountain bias
    horizon_bias = (1.0 - (y_coords / grid_h)) ** 1.8

    elevation = (lum * 0.42 + edge_elevation * 0.38 + horizon_bias * 0.35) * height_scale

    # Smooth the center area where player and chest sit
    center_blend = np.clip(radial_dist / center_flat_radius, 0.0, 1.0)
    center_blend = 0.5 * (1.0 - np.cos(np.pi * center_blend))
    elevation = elevation * center_blend

    # Smooth to give soft snow dunes
    try:
        from scipy.ndimage import gaussian_filter
        elevation = gaussian_filter(elevation, sigma=smooth_sigma)
    except ImportError:
        kernel = np.ones((5, 5), dtype=np.float32) / 25.0
        padded = np.pad(elevation, 2, mode='edge')
        smoothed = np.zeros_like(elevation)
        for dy in range(5):
            for dx in range(5):
                smoothed += kernel[dy, dx] * padded[dy:dy+grid_h, dx:dx+grid_w]
        elevation = smoothed

    vertices = []
    uvs = []

    for y in range(grid_h):
        for x in range(grid_w):
            vx = ((x / (grid_w - 1)) - 0.5) * terrain_width
            vz = ((y / (grid_h - 1)) - 0.5) * terrain_depth
            vy = elevation[y, x]
            vertices.append((vx, vy, vz))
            uvs.append((x / (grid_w - 1), 1.0 - (y / (grid_h - 1))))

    faces = []
    for y in range(grid_h - 1):
        for x in range(grid_w - 1):
            i0 = y * grid_w + x + 1
            i1 = i0 + 1
            i2 = (y + 1) * grid_w + x + 1
            i3 = i2 + 1
            faces.append((i0, i1, i2))
            faces.append((i1, i3, i2))

    base_name = os.path.splitext(output_obj)[0]
    mtl_filename = os.path.basename(base_name) + ".mtl"
    tex_filename = os.path.basename(base_name) + "_tex.png"
    out_dir = os.path.dirname(output_obj) or "."
    mtl_path = os.path.join(out_dir, mtl_filename)
    tex_path = os.path.join(out_dir, tex_filename)

    img.save(tex_path, "PNG")

    with open(mtl_path, "w", encoding="utf-8") as f:
        f.write("# Spider Engine Snow World Material\n")
        f.write("newmtl Material_SnowWorld\n")
        f.write("Ka 1.000 1.000 1.000\n")
        f.write("Kd 1.000 1.000 1.000\n")
        f.write("Ks 0.150 0.150 0.150\n")
        f.write("Ns 30.0\n")
        f.write("d 1.0\n")
        f.write(f"map_Kd {tex_filename}\n")

    print(f"[*] Writing 3D OBJ terrain mesh to: {output_obj}")
    with open(output_obj, "w", encoding="utf-8") as f:
        f.write("# Spider Game Engine - Meta Snow World 3D Mesh\n")
        f.write(f"mtllib {mtl_filename}\n")
        f.write("o Meta_Snow_World_Terrain\n")
        for v in vertices:
            f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        for uv in uvs:
            f.write(f"vt {uv[0]:.4f} {uv[1]:.4f}\n")
        f.write("usemtl Material_SnowWorld\n")
        f.write("s 1\n")
        for face in faces:
            f.write(f"f {face[0]}/{face[0]} {face[1]}/{face[1]} {face[2]}/{face[2]}\n")

    glb_path = os.path.splitext(output_obj)[0] + ".glb"
    try:
        import trimesh
        mesh = trimesh.load(output_obj)
        mesh.export(glb_path)
        glb_size_kb = os.path.getsize(glb_path) / 1024
        print(f"    - GLB Path: {glb_path} ({glb_size_kb:.1f} KB) [Binary packed ready for useGLTF]")
    except Exception as e:
        print(f"    - Note: GLB export skipped: {e}")

    file_size_kb = os.path.getsize(output_obj) / 1024
    print(f"[+] Success! Generated 3D Snow World Terrain:")
    print(f"    - Vertices: {len(vertices):,}")
    print(f"    - Faces: {len(faces):,}")
    print(f"    - OBJ Path: {output_obj} ({file_size_kb:.1f} KB)")
    print(f"    - MTL Path: {mtl_path}")
    print(f"    - Texture:  {tex_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert 2D Image to 3D OBJ mesh for Spider Engine")
    parser.add_argument("--image", required=True, help="Path to input 2D image")
    parser.add_argument("--out", default="public/assets/generated_3d_prop.obj", help="Path to output .obj mesh")
    parser.add_argument("--grid", type=int, default=120, help="Mesh grid resolution (e.g. 120)")
    parser.add_argument("--depth", type=float, default=0.55, help="Volumetric depth extrusion scale")
    parser.add_argument("--terrain", action="store_true", help="Generate wide ground terrain heightmap instead of isolated prop")
    args = parser.parse_args()

    if args.terrain:
        image_to_3d_terrain(args.image, args.out, grid_size=args.grid)
    else:
        image_to_3d_mesh(args.image, args.out, grid_size=args.grid, depth_scale=args.depth)
