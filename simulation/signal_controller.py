"""
GreenCorridor AI - Module 8: SUMO TraCI Traffic Light Priority Controller
Connects to TraCI socket interface to override traffic lights upon emergency priority request.
"""

import os
import sys

try:
    if 'SUMO_HOME' in os.environ:
        tools = os.path.join(os.environ['SUMO_HOME'], 'tools')
        sys.path.append(tools)
    import traci
    HAS_TRACI = True
except ImportError:
    HAS_TRACI = False

class TraCISignalController:
    def __init__(self, sumocfg_path: str = "simulation/configurations/city.sumocfg", use_gui: bool = False):
        self.sumocfg_path = sumocfg_path
        self.use_gui = use_gui
        self.is_connected = False
        self.sumo_binary = "sumo-gui" if use_gui else "sumo"

    def connect(self) -> bool:
        if not HAS_TRACI:
            return False
        try:
            traci.start([self.sumo_binary, "-c", self.sumocfg_path, "--tripinfo-output", "tripinfo.xml"])
            self.is_connected = True
            return True
        except Exception:
            self.is_connected = False
            return False

    def set_priority_green(self, tls_id: str, phase_index: int = 0):
        """Forces the specified traffic light to prioritize the green arterial phase."""
        if self.is_connected and HAS_TRACI:
            try:
                traci.trafficlight.setPhase(tls_id, phase_index)
            except Exception as e:
                print(f"TraCI error setting phase on {tls_id}: {e}")

    def step(self):
        if self.is_connected and HAS_TRACI:
            try:
                traci.simulationStep()
            except Exception:
                self.is_connected = False

    def close(self):
        if self.is_connected and HAS_TRACI:
            try:
                traci.close()
            except Exception:
                pass
            self.is_connected = False
